<?php
class Slicerdatastore_Upgrade_1_0_1 extends MIDASUpgrade
{
  public function preUpgrade()
    {
    // The goal is to change the category metadata format in order to improve Solr support
    $metadataDaos = array(MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "mrbextrator", "category")
        , MidasLoader::loadModel('Metadata')->getMetadata(MIDAS_METADATA_TEXT, "tmp", "category"));
    
    $db = Zend_Registry::get('dbAdapter');
    $prefix = "zzz";
      
    foreach($metadataDaos as $metadataDao)
      {
      if(!$metadataDao) continue;
      $results = $db->query("SELECT metadatavalue_id, value, itemrevision_id FROM metadatavalue WHERE metadata_id='".$metadataDao->getKey()."' order by value ASC")
               ->fetchAll();
      foreach($results as $result)
        {
        if(strpos($result['value'], $prefix) !== false)
          {
          continue; // Means it is already the news format
          }
        $newValue = $prefix.trim($result['value']).$prefix;
        $id = $result['metadatavalue_id'];
        $revisionId = $result['itemrevision_id'];
        
        if(!is_numeric($id))
          {
          throw new Zend_Exception("Error metadatavalue_id");
          }
        $db->query("UPDATE metadatavalue SET value = '".mysql_real_escape_string($newValue)."' WHERE metadatavalue_id='".$id."'");
        
        $revision = MidasLoader::loadModel("ItemRevision")->load($revisionId);
        if($revision)
          {
          MidasLoader::loadModel("Item")->save($revision->getItem()); // for solr update
          }     
        }      
      }
    }

  public function mysql()
    {
   
    }

  public function pgsql()
    {

    }

  public function postUpgrade()
    {
    }
}
?>
