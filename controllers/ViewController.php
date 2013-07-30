<?php
/*=========================================================================
 MIDAS Server
 Copyright (c) Kitware SAS. 26 rue Louis Guérin. 69100 Villeurbanne, FRANCE
 All rights reserved.
 More information http://www.kitware.com

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0.txt

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
=========================================================================*/

/** Controller for individual dataset */
class Slicerdatastore_ViewController extends Slicerdatastore_AppController
{
  /**
   * Action for rendering the dataset page
   * @param itemId The dataset id to view
   */
  function indexAction()
    {
    $this->disableLayout();
    $itemId = $this->_getParam("itemId");
    if(!isset($itemId) || !is_numeric($itemId))
      {
      throw new Zend_Exception("itemId should be a number");
      }
    $itemDao = MidasLoader::loadModel("Item")->load($itemId);
    if($itemDao === false)
      {
      throw new Zend_Exception("This item doesn't exist.", 404);
      }
    if(!MidasLoader::loadModel("Item")->policyCheck($itemDao, $this->userSession->Dao, MIDAS_POLICY_READ))
      {
      throw new Zend_Exception('Read permission required', 403);
      }
      
    $metadataRevision = false;
    foreach($itemDao->getRevisions() as $revision)
      {
      if($revision->getChanges() == "Scenes' metadata") $metadataRevision = $revision;
      }
    if(!$metadataRevision) throw new Zend_Exception('Unable to find metadata.');
    
    $metadata = array();    
    $screenshots = array();
    foreach($metadataRevision->getBitstreams() as $bitstream)
      {
      $ext = strtolower(substr(strrchr($bitstream->getName(), '.'), 1));
      if($ext == "json") $metadata = JsonComponent::decode(file_get_contents($bitstream->getFullPath()));
      if($ext == "png") 
        {
        $tmp = explode(".", $bitstream->getName());
        $tmp = $tmp[0];
        $tmp = explode("_", $tmp);
        $tmp = $tmp[0];        
        $screenshots[$bitstream->getKey()] = $tmp;
        }
      }    
    $midasMetadata = MidasLoader::loadModel('ItemRevision')->getMetadata(MidasLoader::loadModel("Item")->getLastRevision($itemDao));
    $this->view->category = false;
    $this->view->contributor = false;
    $this->view->homepage = false;
    
    foreach($midasMetadata as $m)
      {
      if($m->getQualifier() == 'category') $this->view->category = $m->getValue();
      if($m->getQualifier() == 'contributor') $this->view->contributor = $m->getValue();
      if($m->getQualifier() == 'homepage') $this->view->homepage = $m->getValue();
      }
    $this->view->item = $itemDao;        
    $this->view->metadata = $metadata;    
    $this->view->screenshots = $screenshots;        
    $this->view->json['category'] = $this->view->category;    
    $this->view->json['item'] = $itemDao;    
    $this->view->json['modules']['ratings'] = MidasLoader::loadModel('Itemrating', 'ratings')->getAggregateInfo($itemDao);
    if($this->userSession->Dao)
      {
      $this->view->json['modules']['ratings']['userRating'] = MidasLoader::loadModel('Itemrating', 'ratings')->getByUser($this->userSession->Dao, $itemDao);
      }
    
    $componentLoader = new MIDAS_ComponentLoader();
    $commentComponent = $componentLoader->loadComponent('Comment', 'comments');
    list($comments, $total) = $commentComponent->getComments($itemDao, 10, 0);
    $this->view->json['modules']['comments'] = array('comments' => $comments,
                                  'total' => $total,
                                  'user' => $this->userSession->Dao);

    $this->view->layout = $this->view->json['layout'];
    }
    
  /**
   * Download a bitstream (mainly used for thumbnails)
   */
  function downloadAction()
    {
    $this->disableLayout();
    $bitsreamid = $this->_getParam("bitstream");
    $componentLoader = new MIDAS_ComponentLoader();
    $modelLoader = new MIDAS_ModelLoader();
    if(isset($bitsreamid) && is_numeric($bitsreamid))
      {
      $bitstream = $modelLoader->loadModel("Bitstream")->load($bitsreamid);
      if(!$bitstream)
        {
        throw new Zend_Exception('Invalid bitstream id', 404);
        }
      $revision = $bitstream->getItemrevision();
      $item = $revision->getItem();
      if($item == false || !$modelLoader->loadModel("Item")->policyCheck($item, $this->userSession->Dao))
        {
        throw new Zend_Exception('Permission denied');
        }
      $componentLoader->loadComponent("DownloadBitstream")->download($bitstream, 0, false);
      return;
      }
    else
      {
      throw new Zend_Exception("No parameters, expecting  bitstream.");
      }
    }
} // end class
