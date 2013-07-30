<?php

class Slicerdatastore_UserController extends Slicerdatastore_AppController
{
  function init()
    {
    }

    
  /** index action*/
  function loginAction()
    {
    $this->disableLayout();
    $this->view->json['register'] = isset($_GET['register']);
    }      
    
  function loginformAction()
    {
    $this->disableLayout();
    Zend_Loader::loadClass("UserForm", BASE_PATH . '/core/controllers/forms');
    $userForm = new UserForm();
    $userForm->uri = $this->getRequest()->getRequestUri();
    $form = $userForm->createLoginForm();
    $this->view->form = $this->getFormAsArray($form);
    $this->disableLayout();
    $this->callCoreAction();   
    }
}//end class