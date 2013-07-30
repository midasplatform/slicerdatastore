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

/**
 * @package Slicer App Store
 * Appcontroller for this module
 */
class Slicerdatastore_AppController extends MIDAS_GlobalModule
  {
    public $moduleName='slicerdatastore';
    
    /**
    * Called before every pages 
    */
   public function preDispatch()
     {     
     parent::preDispatch();
     $this->view->moduleParent = (strpos(__FILE__, "privateModules") === false) ? "modules":"privateModules";
     $this->view->json['global']['moduleParent'] = $this->view->moduleParent;
     $this->view->json['global']['httpUrl'] = UtilityComponent::getServerURL();
     
     }
  } //end class
