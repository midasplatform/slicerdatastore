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

/** Controller allowing an user to upload a dataset */
class Slicerdatastore_UploadController extends Slicerdatastore_AppController
{

  /** 
   * Main upload page allowing an user to set the name and category
   */
  function indexAction()
    {
    $this->disableLayout();
    if(!$this->logged) $this->_redirect ("/slicerdatastore/user/login");  
    
    $itemId = $this->_getParam("itemId");
        
    // check if the configuration is valid
    $folderId = MidasLoader::loadModel("Setting")->getValueByName('rootFolder', "slicerdatastore");
    $folder = MidasLoader::loadModel("Folder")->load($folderId);
    if(!$folder)
      {
      throw new Zend_Exception("Unable to find Root Folder. Please check the configuration");
      }
      
    $itemDao = MidasLoader::loadModel("Item")->load($itemId);
    $this->view->item = false;
    $this->view->description = "";
    $this->view->categories = array();
    if(isset($itemId) && $itemDao && MidasLoader::loadModel("Item")->policyCheck($itemDao, $this->userSession->Dao, MIDAS_POLICY_ADMIN))
      {
      $lastRevision = MidasLoader::loadModel("Item")->getLastRevision($itemDao);
      $this->view->item = $itemDao;
      $this->view->description = MidasLoader::loadComponent("Metadata", "slicerdatastore")
              ->getMidasMetada($itemDao, 'description');
      $this->view->categories = MidasLoader::loadComponent("Metadata", "slicerdatastore")
              ->getRevisionCategories($lastRevision);
      
      if($this->_request->isPost()) // Edit metadata
        {
        $this->disableLayout();
        $this->disableView();
        $params = $this->_getAllParams();
        $itemDao->setName($params['name']);
        
        MidasLoader::loadComponent("Metadata", "slicerdatastore")->setRevisionCategories($lastRevision, $params['categories']);
        MidasLoader::loadComponent("Metadata", "slicerdatastore")->setMidasMetada($itemDao, "description", $params['description']);
        
        MidasLoader::loadModel('Item')->save($itemDao); // update solr
        return;
        }
      }
      
     
    $this->view->json['upload'] = array();
    $this->view->json['upload']['itemId'] = (isset($itemId))? $itemId:-1;
    $this->view->json['upload']['availableTags'] = MidasLoader::loadComponent('Api', 'slicerdatastore')->categories(array());
    }
   
   /**
    * Save the uploaded scene
    * @throws Zend_Exception
    * @throws Exception
    */
  function generatetokenAction()
    {
    $this->disableLayout();
    $this->disableView();
    if(!$this->logged)
      {
      throw new Zend_Exception(MIDAS_LOGIN_REQUIRED);
      }
    $folderId = MidasLoader::loadModel("Setting")->getValueByName('rootFolder', "slicerdatastore");
    $folder = MidasLoader::loadModel("Folder")->load($folderId);
    if(!$folder)
      {
      throw new Zend_Exception("Unable to find Root Folder. Please check the configuration");
      }
      
    $itemId = $this->_getParam("itemId");
    $itemDaoTmp = MidasLoader::loadModel("Item")->load($itemId);
    $mainItem = false;
    if($itemDaoTmp && MidasLoader::loadModel("Item")->policyCheck($itemDaoTmp, $this->userSession->Dao, MIDAS_POLICY_ADMIN))
      {
      $mainItem = $itemDaoTmp;
      }
      
    $params = $this->_getAllParams();
    
    $itenname = $params['name'];
    $description = $params['description'];
    $categories = (isset($params['categories']))? $params['categories'] : array();   
    $changes = $params['changes'];   
    if(empty($categories)) $categories = array("Others");

    if(!$mainItem)
      {
      $item = MidasLoader::loadModel('Item')->createItem($itenname, "", $folder);  
      }
    else
      {
      $item = $mainItem;
      $itenname = $item->getName();
      $lastRevision = MidasLoader::loadModel('Item')->getLastRevision($item);
      $categories = MidasLoader::loadComponent("Metadata", "slicerdatastore")->getRevisionCategories($lastRevision);
      MidasLoader::loadModel("ItemRevision")->deleteMetadata($lastRevision);
      }
    
    if($item === false)
      {
      throw new Exception('Create new item failed', MIDAS_INTERNAL_ERROR);
      }
    Zend_Loader::loadClass('ItemRevisionDao', BASE_PATH.'/core/models/dao');
    $revision = new ItemRevisionDao();
    $revision->setChanges($changes);
    $revision->setUser_id($this->userSession->Dao->getKey());
    $revision->setDate(date('c'));
    $revision->setLicenseId(null);
    MidasLoader::loadModel('Item')->addRevision($item, $revision);
    
    MidasLoader::loadComponent("Metadata", "slicerdatastore")->setRevisionCategories($revision, $categories);
    MidasLoader::loadComponent("Metadata", "slicerdatastore")->setMidasMetada($item, "description", $description);
    
    MidasLoader::loadModel('Itempolicyuser')->createPolicy($this->userSession->Dao, $item, MIDAS_POLICY_ADMIN);
    $anonymousGroup = MidasLoader::loadModel('Group')->load(MIDAS_GROUP_ANONYMOUS_KEY);
    MidasLoader::loadModel('Itempolicygroup')->createPolicy($anonymousGroup, $item, MIDAS_POLICY_READ);
    
    $filename = str_replace("'", "", str_replace('/', '_', str_replace('"', '', $itenname.".mrb")));
    
    $uploadComponent = MidasLoader::loadComponent('Httpupload');
    $uploadComponent->setTmpDirectory($this->getTempDirectory());
    $token = $uploadComponent->generateToken(array('filename' => $filename), $this->userSession->Dao->getKey().'/'.$item->getKey());
    $url = $this->getServerURL().$this->view->webroot."/api/json?method=midas.upload.perform&changes=".urlencode($changes)."&revision=".$revision->getRevision()."&mode=stream&file=1&filename=". urlencode($filename)."&uploadtoken=". $token['token']."&length=";
    echo JsonComponent::encode($url);
    }   
    
  
} // end class
