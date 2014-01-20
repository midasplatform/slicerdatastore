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

class Slicerdatastore_UserCoreController extends Slicerdatastore_AppController
{   
  function loginAction()
    {
    if($this->_request->isPost())
      {
      ob_start(); 
      $this->callCoreAction();
      $out1 = JsonComponent::decode(ob_get_contents());
      ob_clean(); 
      if($out1['status'] == "1")
        {
        $instanceSalt = Zend_Registry::get('configGlobal')->password->prefix;
        $userDao = MidasLoader::loadModel("User")->load($this->userSession->Dao->getKey());
        if($userDao)
          {
          $passwordHash = hash($userDao->getHashAlg(), $instanceSalt.$userDao->getSalt().$_POST['password']);
          $out1['localStore'] = $userDao->getKey().'-'.$passwordHash;
          }
        }
      $this->disableLayout();
      $this->disableView();
      echo JsonComponent::encode($out1); 
      }
    else
      {
      $this->callCoreAction();
      }
    }
  
  function registerAction()
    {
    if(strpos($_SERVER['HTTP_REFERER'], "slicerdatastore") === false)
      {
      $this->callCoreAction();
      return;
      }
    if(isset(Zend_Registry::get('configGlobal')->closeregistration) && Zend_Registry::get('configGlobal')->closeregistration == "1")
      {
      throw new Zend_Exception('New user registration is disabled.');
      }

    if(!isset($_GET['previousUri'])) $_GET['previousUri'] = '/slicerdatastore/upload';
      
    Zend_Loader::loadClass("UserForm", BASE_PATH . '/core/controllers/forms');
    $userForm = new UserForm();
    $form = $userForm->createRegisterForm();
    if($this->_request->isPost() && $form->isValid($this->getRequest()->getPost()))
      {
      if(MidasLoader::loadModel("User")->getByEmail(strtolower($form->getValue('email'))) !== false)
        {
        throw new Zend_Exception("User already exists.");
        }

      if(!isset(Zend_Registry::get('configGlobal')->verifyemail) || Zend_Registry::get('configGlobal')->verifyemail != '1')
        {
        if(!headers_sent())
          {
          session_start();
          }
        $this->userSession->Dao = MidasLoader::loadModel("User")->createUser(trim($form->getValue('email')), $form->getValue('password1'), trim($form->getValue('firstname')), trim($form->getValue('lastname')));
        session_write_close();

        $this->_redirect(str_replace($this->view->webroot, "", $_GET['previousUri']));
        }
      else
        {
        $email = strtolower(trim($form->getValue('email')));
        $pendingUser = MidasLoader::loadModel("PendingUser")->createPendingUser($email, $form->getValue('firstname'), $form->getValue('lastname'), $form->getValue('password1'));

        $subject = 'Midas user registration';
        $headers = "From: Midas\nReply-To: no-reply\nX-Mailer: PHP/".phpversion()."\nMIME-Version: 1.0\nContent-type: text/html; charset = UTF-8";
        $url = $this->getServerURL().$this->view->webroot.'/user/verifyemail?email='.$email;
        $url .= '&authKey='.$pendingUser->getAuthKey();
        $body = "You have created an account on Midas.<br/><br/>";
        $body .= '<a href="'.$url.'">Click here</a> to verify your email and complete registration.<br/><br/>';
        $body .= 'If you did not initiate this registration, please disregard this email.<br/><br/>';
        $body .= "-Midas administrators";
        if($this->isTestingEnv() || mail($email, $subject, $body, $headers))
          {
          $this->_redirect('/user/emailsent');
          }
        }
      }
    $this->view->form = $this->getFormAsArray($form);
    $this->disableLayout();
    $this->view->jsonRegister = JsonComponent::encode(array(
      'MessageNotValid' => $this->t('The e-mail is not valid'),
      'MessageNotAvailable' => $this->t('That email is already registered'),
      'MessagePassword' => $this->t('Password too short'),
      'MessagePasswords' => $this->t('The passwords are not the same'),
      'MessageLastname' => $this->t('Please set your lastname'),
      'MessageTerms' => $this->t('Please validate the terms of service'),
      'MessageFirstname' => $this->t('Please set your firstname')
    ));
    $this->render('register');
    } // end method indexAction
    
}//end class
