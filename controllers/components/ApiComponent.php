<?php
/*=========================================================================
MIDAS Server
Copyright (c) Kitware SAS. 20 rue de la Villette. All rights reserved.
69328 Lyon, FRANCE.

See Copyright.txt for details.
This software is distributed WITHOUT ANY WARRANTY; without even
the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
PURPOSE.  See the above copyright notices for more information.
=========================================================================*/

/** Component for api methods */
class Slicerdatastore_ApiComponent extends AppComponent
{

  /**
   * Helper function for verifying keys in an input array
   */
  private function _checkKeys($keys, $values)
    {
    foreach($keys as $key)
      {
      if(!array_key_exists($key, $values))
        {
        throw new Exception('Parameter '.$key.' must be set.', -1);
        }
      }
    }

  /**
   * Helper function to get the user from token or session authentication
   */
  private function _getUser($args)
    {
    $componentLoader = new MIDAS_ComponentLoader();
    if(file_exists(BASE_PATH."/modules/api/controllers/components/AuthenticationComponent.php"))
      {
      $authComponent = $componentLoader->loadComponent('Authentication', 'api');
      }           
    else  $authComponent = $componentLoader->loadComponent('Authentication');
    return $authComponent->getUser($args, null);
    }


  /**
   * Get the list of categories
   * @return list categories
   */
  function categories($args)
    {
    return MidasLoader::loadComponent("Metadata", "slicerdatastore")->getAllCategories();
    }
    
  /**
   * Automatically authenticate an user using local storage data
   * @param sting Data
   * @return boolean
   */ 
  function authenticate($args)
    {
    $data = $args['data'];
    if(!empty($data))
      {
      $tmp = explode('-', $data);
      if(count($tmp) == 2)
        {
        $userDao = MidasLoader::loadModel("User")->load($tmp[0]);
        if($userDao != false)
          {
          // authenticate valid users in the appropriate method for the
          // current application version
          if(version_compare(Zend_Registry::get('configDatabase')->version, '3.2.12', '>='))
            {
            $auth = MidasLoader::loadModel("User")->hashExists($tmp[1]);
            }
          else
            {
            $auth = MidasLoader::loadModel("User")->legacyAuthenticate($userDao, '', '', $tmp[1]);
            }
          // if authenticated, set the session user to be this user
          if($auth)
            {
            session_start();
            Zend_Session::start();
            $user = new Zend_Session_Namespace('Auth_User');
            $user->setExpirationSeconds(60 * Zend_Registry::get('configGlobal')->session->lifetime);
            $user->Dao = $userDao;
            session_write_close();
            return true;
            }
          }
        }
      }
    return false;
    }
   

  /**
   * Call with ajax and filter parameters to get a list of datasets
   * @param category The category filter
   * @param limit Pagination limit
   * @param offset Pagination offset
   */
  function listdatasets($args)
    {
    $offset = 0;
    $limit = 800;
    
    $query = "text-mrbextrator.slicerdatastore:true";
      
    $itemsFiler = MidasLoader::loadComponent("Metadata", "slicerdatastore")->getItemsByCategory($args['category']);

    if(isset($args['query']) && !empty($args['query']))
      {
      $query .= ' AND (name: '.$args['query'].
                 ' OR description: '.$args['query'].')';
      }

    $itemIds = array();
    $componentLoader = new MIDAS_ComponentLoader();
    $solrComponent = $componentLoader->loadComponent('Solr', 'solr');
    
    if(file_exists(BASE_PATH."/modules/api/controllers/components/AuthenticationComponent.php"))
      {
      $authComponent = $componentLoader->loadComponent('Authentication', 'api');
      }           
    else  $authComponent = $componentLoader->loadComponent('Authentication');
    $userDao = $authComponent->getUser($args,
                                       Zend_Registry::get('userSession')->Dao);    
    
    try
      {
      $index = $solrComponent->getSolrIndex();
      UtilityComponent::beginIgnoreWarnings(); //underlying library can generate warnings, we need to eat them
      $response = $index->search($query, $offset, $limit + 10 , array('fl' => '*,score')); //extend limit to allow some room for policy filtering
      UtilityComponent::endIgnoreWarnings();

      $totalResults = $response->response->numFound;
      foreach($response->response->docs as $doc)
        {
        $itemIds[] = $doc->key;
        }
      }
    catch(Apache_Solr_HttpTransportException $e)
      {
      throw new Exception('Syntax error in query', -1);
      }

    $modelLoader = new MIDAS_ModelLoader();
    $itemModel = $modelLoader->loadModel('Item');
    $items = array();
    $count = 0;
    foreach($itemIds as $itemId)
      {
      if(!empty($itemsFiler) && !in_array($itemId, $itemsFiler)) continue;
      $item = $itemModel->load($itemId);
      if($item && $itemModel->policyCheck($item, $userDao))
        {
        $rating = MidasLoader::loadModel("Itemrating", 'ratings')->getAggregateInfo($item);
        $lastRevision = MidasLoader::loadModel("Item")->getLastRevision($item);
        $bitstream = end($lastRevision->getBitstreams());    
        if(!$bitstream) continue;
           
        $items[] = array( 'title' => $item->getName(), 'rating' => $rating, 'bitstream_id' => $bitstream->getKey(),
            'type' => $item->getType(), 'id' => $item->getKey(), 'description' => $item->getDescription());
        $count++;
        if($count >= $limit)
          {
          break;
          }
        }
      }
      
    function sortByName($a, $b)
      {
      $a_n = strtolower($a['title']);
      $b_n = strtolower($b['title']);
      if($a_n == $b_n)
        {
        return 0;
        }
        

      return ($a_n > $b_n ) ? 1 : -1;
      }
      
    usort($items, "sortByName");

    return array('offset' => $offset, 'total' => $totalResults , 'items'=>$items);
    }

} // end class
