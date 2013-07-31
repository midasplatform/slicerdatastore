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

/** Controller for the list of all datasets */
class Slicerdatastore_IndexController extends Slicerdatastore_AppController
{
  /**
   * Action for rendering the page that lists datasets
   * @param os (Optional) The default operating system to filter by
   * @param arch (Optional) The default architecture to filter by
   * @param release (Optional) The default release to filter by
   */
  function indexAction()
    {
    $this->disableLayout();
    $this->view->json['category'] = $this->_getParam("category");
    }
    
    
  /**
   * Call this to render the kitware info dialog
   */
  public function kwinfoAction()
    {
    $this->disableLayout();
    }
} // end class
