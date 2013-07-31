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

/** Module configure controller */
class Slicerdatastore_ConfigController extends Slicerdatastore_AppController
{
  /** index action */
  function indexAction()
    {
    $this->requireAdminPrivileges();
    $this->view->rootFolder = MidasLoader::loadModel("Setting")->getValueByName('rootFolder', "slicerdatastore");
    $this->view->json['isConfigSaved'] = 0;

    if($this->_request->isPost() && is_numeric($_POST['rootFolder']))
      {
      $this->view->json['isConfigSaved'] = 1;
      $this->view->rootFolder = $_POST['rootFolder'];
      MidasLoader::loadModel("Setting")->setConfig('rootFolder', $this->view->rootFolder, "slicerdatastore");
      }
    } // end indexAction

} // end class
