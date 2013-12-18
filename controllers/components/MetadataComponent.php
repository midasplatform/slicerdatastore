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

/** Manage metadata */
// zzz is used as a search prefix and suffix to improve solr metadata search
class Slicerdatastore_MetadataComponent extends AppComponent
{
  /** get MetadataRevision
   *  @param Item
   *  @return Revision
   */
  function getMetadataRevision($item)
    {
    $metadataRevision = false;
    foreach($item->getRevisions() as $revision)
      {
      if($revision->getChanges() == "Scenes' metadata") $metadataRevision = $revision;
      }
    return $metadataRevision;    
    }
    
  /** 
   * Get Midas Metadata
   * @param Item
   * @param metadata type
   * @return string
   */
  function getMidasMetada($item, $type)
    {
    $midasMetadata = MidasLoader::loadModel('ItemRevision')->getMetadata(MidasLoader::loadModel("Item")->getLastRevision($item));
    foreach($midasMetadata as $m)
      {
      if($m->getQualifier() == $type) return $m->getValue();
      }
    return false;
    }
    
  /** 
   * Set Midas Metadata
   * @param Item
   * @param metadata type
   * @return string
   */
  function setMidasMetada($item, $type, $value)
    {
    $this->setMetaDataByQualifier(MidasLoader::loadModel("Item")->getLastRevision($item), $type, $value); 
    }
    
  /**
   * Get the MRB information
   * @param revision
   * @return array($metadata, $screenshots)
   */
  function getMRBMetadata($revision)
    {
    $metadata = array();    
    $screenshots = array();
    foreach($revision->getBitstreams() as $bitstream)
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
      
    // Fix order
    function cmp($a, $b)
      {
      if(!isset($a['order']) || !isset($b['order'])) return 0;
      if($a['order'] == $b['order']) 
        {
        return 0;
        }
      return ($a['order'] < $b['order']) ? -1 : 1;
      }
    usort($metadata, "cmp");
    
    foreach($metadata as $key => $m)
      {
      if(isset($m['order']) && $m['order'] == 0) unset($metadata[$key]);
      }
      
    return array($metadata, $screenshots);
    }
  
  /**
   * Get the categories of a revision
   * @param revision
   * @return Array of values
   */
  function getRevisionCategories($revision)
    {
    $metadata = array();
    $dao = $this->getMetaDataByQualifier($revision, "category");
    if($dao)
      {
      $values = explode(" --- ", $dao->getValue());
      foreach($values as $value)
        {          
        if(strpos($value, "zzz") === false) continue;
        $metadata[] = trim(str_replace('zzz', '', $value));     
        }
      }      
    return array_unique($metadata);
    }
    
  /**
   * Set the categories of a revision
   * @param revision
   * @param array of categories
   */
  function setRevisionCategories($revision, $values)
    {
    if(!is_array($values))
      {
      throw new Zend_Exception("Should be an array");
      }
    
    foreach($values as $key => $v)
      {
      $values[$key] = "zzz".trim($v)."zzz";
      }
      
    $categoriesString = join(" --- ", $values);
    $this->setMetaDataByQualifier($revision, "category", $categoriesString);   
    }
  
  /**
   * Get the list of categories
   * @return list categories
   */
  function getAllCategories()
    {
    // Get list of categories using solr
    $metadataDao = MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", "category");
    $enabledDao = MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", "slicerdatastore");
    $terms = array();   
    if($metadataDao)
      {
      $db = Zend_Registry::get('dbAdapter');
      $results = $db->query("SELECT value, itemrevision_id FROM metadatavalue WHERE metadata_id='".$metadataDao->getKey()."' order by value ASC")
               ->fetchAll();
      foreach($results as $result)
        {
        $arrayTerms = explode(" --- ", $result['value']);
        foreach($arrayTerms as $term)
          {          
          if(strpos($term, "zzz") === false) continue;
          $tmpResults = $db->query("SELECT value FROM metadatavalue WHERE itemrevision_id='".$result['itemrevision_id']."' AND metadata_id='".$enabledDao->getKey()."' order by value ASC")
               ->fetchAll();
          if(empty($tmpResults))continue;
          $term = trim(str_replace('zzz', '', $term));
          if(!isset($terms[$term]))
            {
            $terms[$term] = 0;
            }
          $terms[$term]++;
          }
        }      
      }
    ksort($terms);
    return $terms;
    }
    
  /** Get items by categories */
  function getItemsByCategory($name)
    {
    $metadataDao = MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", "category");
    $enabledDao = MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", "slicerdatastore");
    $items = array();   
    if($metadataDao)
      {
      $db = Zend_Registry::get('dbAdapter');
      $escaped = $db->quote("%".$name."%");
      $results = $db->query("SELECT itemrevision_id FROM metadatavalue WHERE value LIKE $escaped AND metadata_id='".$metadataDao->getKey()."'")
               ->fetchAll();
      
      foreach($results as $result)
        {
        $tmpResults = $db->query("SELECT value FROM metadatavalue WHERE itemrevision_id='".$result['itemrevision_id']."' AND metadata_id='".$enabledDao->getKey()."'")
               ->fetchAll();
        if(empty($tmpResults))continue;
        $revision = MidasLoader::loadModel("ItemRevision")->load($result['itemrevision_id']);
        if($revision)
          {
          $items[] = $revision->getItem()->getKey();
          }
        }      
      }
    return $items;
    }

    /**
   * Save metadata value
   * @param string $type
   * @param string $value
   * @return MetadataDao
   */
  private function setMetaDataByQualifier($revision, $type, $value)
    {
    // Gets the metadata
    $metadataDao = MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", $type);
    if(!$metadataDao)  MidasLoader::loadModel('Metadata')->addMetadata(MIDAS_METADATA_TEXT, "mrbextrator", $type, "");
    return MidasLoader::loadModel('Metadata')->addMetadataValue($revision, MIDAS_METADATA_TEXT, "mrbextrator", $type, $value);  
    }   
    
    
  /**
   * Get Metadata object
   * @param type $type
   * @return type
   */
  private function getMetaDataByQualifier($revision, $type)
    {
    $metadata = MidasLoader::loadModel('ItemRevision')->getMetadata($revision);
    foreach($metadata as $m)
      {
      if($m->getQualifier() == $type && $m->getElement() != "tmp")
        {
        return $m;
        }
      }
    return false;
    }   
} // end class
