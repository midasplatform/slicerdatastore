var midas = midas || {};
midas.slicerdatastore = midas.slicerdatastore || {};

/**
 * Called when a user clicks the extension button (download, install or uninstall)
 */
var timer = false;

function updateStreamStats(stats){
  if(stats == "-1")
    {
    $( "#modalDialog" ).dialog( "close" );
    if(timer != false) clearTimeout(timer);
    }
  else
    {
    var statsArray = stats.split(';;');
    if(statsArray.length == 2)
      {
      $('#progressDownload').html(statsArray[1]);
      $('#progressBar').attr('value', parseInt(statsArray[0]));
      }

    timer = setTimeout("callbackTimer()",500);
    }
}

function callbackTimer(){
  /* Following will be true when WebEngine is present for Qt5.x  */
  if(typeof qt!='undefined')
  {
    window.DataStoreGUI.getStreamStat(function(stats){
      updateStreamStats(stats);
    });
  }
  else
  {
    var stats = window.DataStoreGUI.getStreamStat();
    updateStreamStats(stats);
  }
}
  
midas.slicerdatastore.extensionButtonClick = function() {
    var extensionId = $(this).attr('element');
    var bitstreamId = $(this).attr('bitstream');
    var extensionName = $(this).attr('extensionname');
    if(extensionName.indexOf(".mrb") == -1)
      {
      extensionName = extensionName+".mrb";
      }
    var url = json.global.httpUrl+json.global.webroot+'/download/bitstream/'+bitstreamId+'/'+extensionId+"_"+extensionName+"?name="+extensionId+"_"+extensionName;
    var urlThumbnail = json.global.httpUrl+json.global.webroot+'/item/thumbnail?itemId='+extensionId;
    
    if(!window.DataStoreGUI) {        
        window.location.assign(url);
      } 
    else 
      { 
      timer = setTimeout("callbackTimer()",1000);
      $( "#modalDialog" ).dialog({
      height: 250,
      width: 500,
      modal: true ,
      resizable: false,
      buttons: {
        Cancel: function() {          
          $( this ).dialog( "close" );
          if(timer != false) clearTimeout(timer);
          window.DataStoreGUI.cancelDownload();
        }
      }
      });
      $('.ui-draggable .ui-dialog-titlebar').hide();
      $("#modalDialog").html("Downloading "+extensionName+"<br/><br/><progress id='progressBar' style='width:100%' value='1' max='100'></progress><br/><span id='progressDownload'></span>");
      
      try
        {
        window.DataStoreGUI.download(url, urlThumbnail);
        }
      catch(err)
        {
        $("#modalDialog").html("An error occurred while downloading the dataset.");
        }
      }
}

midas.slicerdatastore.progressEvent = function(progress)
{
  $('#progressDownload').html(progress+"%");
}
midas.slicerdatastore.downloadCompleted = function(progress)
{
  $( "#modalDialog" ).dialog( "close" );
}

/**
 * Update extension button state considering 'window.extensions_manager_model'
 * @param extensionName Name of the extension associated with the button to update
 */
midas.slicerdatastore.updateExtensionButtonState = function(extensionName) {
  midas.slicerdatastore.setExtensionButtonState(extensionName, 'Download');
}

/**
 * Set extension button state
 * @param extensionName Name of the extension associated with the button to update
 * @param buttonState Either 'download', 'install' or 'uninstall'
 */
midas.slicerdatastore.setExtensionButtonState = function(extensionName, buttonState) {
    if (buttonState != 'Download'
        && buttonState != 'Install'
        && buttonState != 'CancelScheduledForUninstall'
        && buttonState != 'ScheduleUninstall') {
        alert('Unknown buttonState:' + buttonState);
    }
    var buttonText = buttonState;
    if(buttonState == 'ScheduleUninstall') {
      buttonText = 'Uninstall';
    } else if(buttonState == 'CancelScheduledForUninstall') {
      buttonText = 'Uninstall';
    }

    var buttonClass = 'extension' + buttonState + 'Button';
    $('input[extensionname="' + extensionName + '"]').val(buttonText)
      .removeClass('extensionDownloadButton extensionInstallButton extensionCancelScheduledForUninstallButton extensionScheduleUninstallButton')
      .addClass(buttonClass)
      .unbind('click').click(midas.slicerdatastore.extensionButtonClick);
}

midas.slicerdatastore.isPageHidden = function(){
  return document.hidden || document.msHidden || document.webkitHidden;
}

/** manage automatic authentication*/
$(document).ready(function(){
  midas.slicerdatastore.authenticate();
    // Enable logout link
  $('#logoutLink').click(function () {
    
      window.localStorage.removeItem("DataStoreID");
      $.post(json.global.webroot+'/user/logout', {noRedirect: true}, function() {
          window.location.reload();
      });
  });
})

midas.slicerdatastore.authenticate = function(){
  if(json.global.logged == "" && window.localStorage && window.localStorage.getItem('DataStoreID') != null)
    {
    var html = "<div class='modal'>";
    html += "<div id='modelCenter'>";
    html += "<img  src='"+json.global.webroot+"/core/public/images/icons/loading.gif' /> Authenticating... please wait";
    html += "</div>";
    html += "</div>";

    var winWidth = $(window).width();
    var winHeight = $(window).height();  
    $('body').append(html);
    $('body').addClass("loading"); 
    $('#modelCenter').css("position","absolute").css("left", ((winWidth / 2) - ($('#modelCenter').width() / 2)) + "px").css("top", ((winHeight / 2) - ($('#modelCenter').height() / 2)) + "px");
    
    $.post(json.global.webroot+'/api/json?method=midas.slicerdatastore.authenticate', {data: window.localStorage.getItem('DataStoreID')}, function(ret){
      if(ret.data == 1)
        {
        if(json.global.currentUri.indexOf("user/datastorelogin") != -1 || json.global.currentUri.indexOf("user/login") != -1)
          {
          window.location.href = json.global.webroot+"/slicerdatastore/upload";
          }
        else
          {
          window.location.reload();
          }
        }
      else
        {
        $('body').removeClass("loading"); 
        window.localStorage.removeItem("DataStoreID");
        }
    }, "json");    
    }
}