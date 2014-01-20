$(document).ready(function(){
  if(json.register)
    {
    registerForm();
    }
  else
    {
    loginForm();
    }
});

function loginForm()
{
  $('div.loginElement').css('width', '255px');
  $('#registerShare').remove()
  $('div.loginElement').append('<div id="registerShare"><img id="loadingImg" style="display:none;" alt="" src="'+json.global.webroot+'/core/public/images/icons/loading.gif"  /></div>')
  $('#loadingImg').show();
      $.ajax({
          url: json.global.webroot+"/slicerdatastore/user/loginform?previousUri="+json.previousUri,
          contentType: "application/x-www-form-urlencoded;charset=UTF-8",
          success: function(data) {
            $('form#loginForm').remove();
            $('div#registerShare').html(data).find('form#loginForm').css('color', 'black').css('margin-left','18px');
            $('.registerLink').unbind('click').addClass('registerLinkKwshare').removeClass('registerLink');
            $('.registerLinkKwshare').click(registerForm);
            $('form#loginForm a').css('color', 'black');
            $('#registerShareTitle').show();
            $('#email').focus();
          }
      });
}

function registerForm()
{
  $('div.loginElement').css('width', '600px');
  $('#registerShare').remove()
  $('div.loginElement').append('<div id="registerShare"><img id="loadingImg" style="display:none;" alt="" src="'+json.global.webroot+'/core/public/images/icons/loading.gif"  /></div>')
  $('#loadingImg').show();
      $.ajax({
          url: json.global.webroot+"/user/register?previousUri="+json.previousUri,
          contentType: "application/x-www-form-urlencoded;charset=UTF-8",
          success: function(data) {
              $('div#registerShare').html(data).find('form#registerForm').css('color', 'black').css('margin-left','18px');
              $('#registerShareTitle').show();
              $('div.loginElement a ').css('color', 'black');
              $('#email').focus();
              
              $('a.termOfService').unbind('click').click(function () {
                 $('.DialogContentPage').val("terms");
                $('div.MainDialogContent').html("");
                $("div.MainDialogLoading").show();
                $.ajax({
                    url: json.global.webroot+"/user/termofservice",
                    //contentType: "application/x-www-form-urlencoded;charset=UTF-8",
                    success: function (data) {
                        $('div.MainDialogContent').html(data);
                        $('div.MainDialogLoading').hide();
                        $('.dialogTitle').hide();
                    }
                });
               
                midas.showBigDialog("Terms of Service");
            });
          }
      });
}