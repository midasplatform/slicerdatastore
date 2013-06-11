var midas = midas || {};
midas.slicerdatastore = midas.slicerdatastore || {};

var json = null;

/**
 * Displays the login dialog
 */
midas.slicerdatastore.doLogin = function () {
    var content = $('#loginFormTemplate').clone();
    content.find('form.loginForm').attr('id', 'appstoreLoginForm');
    content.find('div.loginError').attr('id', 'appstoreLoginError');
    midas.showDialogWithContent('Login', content.html(), false, { width: 320 });
    $('a.registerLink').click(midas.slicerdatastore.doRegister);
    $('#appstoreLoginForm').ajaxForm({
        success: function (responseText, statusText, xhr, form) {
            var resp = $.parseJSON(responseText);
            if(resp.status == 'ok') {
                window.location.reload();
            } else {
                $('#appstoreLoginError').html('Login failed');
            }
        }
    });
}

/**
 * Displays the register dialog
 */
midas.slicerdatastore.doRegister = function () {
    var content = $('#registerFormTemplate').clone();
    content.find('form.registerForm').attr('id', 'registerForm');
    content.find('div.registerError').attr('id', 'registerError');
    midas.showDialogWithContent('Register', content.html(), false, { width: 380 });
    $('a.loginLink').click(midas.slicerdatastore.doLogin);
    $('#registerForm').ajaxForm({
        success: function (responseText, statusText, xhr, form) {
            var resp = $.parseJSON(responseText);
            if(resp.status == 'ok') {
                window.location.reload();
            } else {
                var errorText = '<ul>';
                if(resp.alreadyRegistered) {
                    $('#registerForm').find('input[type=text],input[type=password]')
                    .removeClass('invalidField').addClass('validField');
                    $('#registerForm').find('input[name=email]').removeClass('validField').addClass('invalidField');
                    errorText += '<li>'+resp.message+'</li>';
                } else {
                    $('#registerForm').find('input[type=text],input[type=password]')
                    .removeClass('validField').addClass('invalidField');

                    $.each(resp.validValues, function(field, value) {
                        $('#registerForm').find('input[name='+field+']')
                        .removeClass('invalidField').addClass('validField');
                    });
                    if(!resp.validValues.email) {
                        errorText += '<li>Invalid email</li>';
                    }
                    if(!resp.validValues.firstname) {
                        errorText += '<li>Invalid first name</li>';
                    }
                    if(!resp.validValues.lastname) {
                        errorText += '<li>Invalid last name</li>';
                    }
                    if(!resp.validValues.password1) {
                        errorText += '<li>Invalid password</li>';
                    }
                    if(!resp.validValues.password2) {
                        errorText += '<li>Passwords must match</li>';
                    }
                }
                errorText += '</ul>';
                $('#registerError').html(errorText);
            }
        }
    });
}

/**
 * Renders the category of this extension as a breadcrumb bar
 */
midas.slicerdatastore.renderCategory = function(category) {
    var currToken = '';
    // if this extension belongs to multiple categories, we just render the first one
    category = category.split(';')[0];
    var categories = category.split('.');
    $.each(categories, function(k, token) {
        currToken += token;
        var html = ' &gt; ';
        html += '<a class="breadcrumbLink" href="'+json.global.webroot+'/slicerdatastore?category='+currToken
            
             + '">' + token + '</a>';
        currToken += '.';
        $('#categoryBreadcrumb').append(html);
    });
};


$(document).ready(function() {
    midas.slicerdatastore.renderCategory(json.category);
      $('div.screenshots a.screenshotPreview').lightBox({
      imageLoading: json.global.webroot+'/'+json.global.moduleParent+'/slicerdatastore/public/images/lightbox/lightbox-ico-loading.gif',
      imageBlank: json.global.webroot+'/'+json.global.moduleParent+'/slicerdatastore/public/images/lightbox/lightbox-blank.gif',
      imageBtnClose: json.global.webroot+'/'+json.global.moduleParent+'/slicerdatastore/public/images/lightbox/lightbox-btn-close.gif',
      imageBtnPrev: json.global.webroot+'/'+json.global.moduleParent+'/slicerdatastore/public/images/lightbox/lightbox-btn-prev.gif',
      imageBtnNext: json.global.webroot+'/'+json.global.moduleParent+'/slicerdatastore/public/images/lightbox/lightbox-btn-next.gif'
      });
      $('div.screenshotContainer').show().imgLiquid({
          fill: false
      });

    $('input.extensionActionButton')
        .attr('element', json.item.item_id)
        .attr('extensionname', json.item.name);
    midas.slicerdatastore.updateExtensionButtonState(json.item.name);

    if(json.layout == 'empty') {
        midas.registerCallback('CALLBACK_RATINGS_AFTER_LOAD', 'ratings', function() {
            $('#loginToComment,#loginToRate').unbind('click').click(midas.slicerdatastore.doLogin);
            $('#registerToComment,#registerToRate').unbind('click').click(midas.slicerdatastore.doRegister);
        });
    }

    $('#commentsDiv h4').remove();
    $('#ratingsDiv h4').remove();
    $('#ratingsUser').appendTo('#ratingsDiv');
    $('div.loginToRate').appendTo('#ratingsDiv');
    $('div.loginToRate').css('float', 'left');

 

    var url = json.global.webroot+'/slicerdatastore';

    $('#rootBreadcrumb').attr('href', url);
    // Enable logout link
    $('#logoutLink').click(function () {
        $.post(json.global.webroot+'/user/logout', {noRedirect: true}, function() {
            window.location.reload();
        });
    });
});
