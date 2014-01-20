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
    if(!isset($_GET['previousUri'])) $_GET['previousUri'] = $this->view->webroot.'/slicerdatastore/upload';
    $this->view->json['register'] = isset($_GET['register']);
    $this->view->json['previousUri'] = urldecode($_GET['previousUri']);
    }      
    
  function loginformAction()
    {
    $this->disableLayout();
    $this->view->previousUri = $_GET['previousUri'];
    Zend_Loader::loadClass("UserForm", BASE_PATH . '/core/controllers/forms');
    $userForm = new UserForm();
    $userForm->uri = $this->getRequest()->getRequestUri();
    $form = $userForm->createLoginForm();
    $this->view->form = $this->getFormAsArray($form);
    $this->disableLayout();
    $this->callCoreAction();   
    }
}//end class