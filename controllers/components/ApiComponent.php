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
    $authComponent = $componentLoader->loadComponent('Authentication', 'api');
    return $authComponent->getUser($args, null);
    }


  /**
   * Get the list of categories
   * @return list categories
   */
  function categories($args)
    {
    // Get list of categories using solr
    $metadataDao = MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", "category");
    $terms = array();   
    if($metadataDao)
      {
      $db = Zend_Registry::get('dbAdapter');
      $results = $db->query("SELECT value, count(value) FROM metadatavalue WHERE metadata_id='".$metadataDao->getKey()."' group by value order by value ASC")
               ->fetchAll();
      foreach($results as $term)
        {
        $key = ucfirst($term['value']);
        $terms[$key] = (int) $term['count(value)'];
        }      
      }
    return $terms;
    }

  /**
   * Call with ajax and filter parameters to get a list of datasets
   * @param category The category filter
   * @param limit Pagination limit
   * @param offset Pagination offset
   */
  function listdatasets($args)
    {
    if(isset($args['offset']))$offset = $args['offset'];
    else $offset = 0;
    if(isset($args['limit']))$limit = $args['limit'];
    else $limit = 0;
    if(isset($args['category']) && !empty($args['category'])) $query = "text-mrbextrator.slicerdatastore:true AND text-mrbextrator.category:".strtolower($args['category']);
    else $query = "text-mrbextrator.slicerdatastore:true";
    
    if(isset($args['query']) && !empty($args['query']))
      {
      $query .= ' AND (name: '.$args['query'].
                 ' OR description: '.$args['query'].')';
      }
    $itemIds = array();
    $componentLoader = new MIDAS_ComponentLoader();
    $solrComponent = $componentLoader->loadComponent('Solr', 'solr');
    
    $authComponent = $componentLoader->loadComponent('Authentication', 'api');
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
    catch(Exception $e)
      {
      throw new Exception('Syntax error in query', -1);
      }

    $modelLoader = new MIDAS_ModelLoader();
    $itemModel = $modelLoader->loadModel('Item');
    $items = array();
    $count = 0;
    foreach($itemIds as $itemId)
      {
      $item = $itemModel->load($itemId);
      if($item && $itemModel->policyCheck($item, $userDao))
        {
        $rating = MidasLoader::loadModel("Itemrating", 'ratings')->getAggregateInfo($item);
        $lastRevision = MidasLoader::loadModel("Item")->getLastRevision($item);
        $bitstream = end($lastRevision->getBitstreams());    
           
        $items[] = array( 'title' => $item->getName(), 'rating' => $rating, 'bitstream_id' => $bitstream->getKey(),
            'type' => $item->getType(), 'id' => $item->getKey(), 'description' => $item->getDescription());
        $count++;
        if($count >= $limit)
          {
          break;
          }
        }
      }

    return array('offset' => $offset, 'total' => $totalResults , 'items'=>$items);
    }

} // end class
