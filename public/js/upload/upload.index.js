var timer = false;
function callbackTimer()
  {
  var stats = window.DataStoreGUI.getStreamStat();
  if(stats == "-1")
    {
    $( "#modalDialog" ).dialog( "close" );
    $( "#modalDialog" ).html('You successfully upload the dataset. It will be available in the next few minutes.')
    $( "#modalDialog" ).dialog({
          height: 200,
          width: 500,
          modal: true ,
          resizable: false,
          buttons: {
            Ok: function() {          
              $( this ).dialog( "close" );
              location.reload();
            }
          }
          });
    
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

$(document).ready(function(){
  $('#submitButton').click(function(){
    if($('#nameResource').val() == "")
      {
      alert('Please define a name.');
      return;
      }
    $(this).remove();
    $( "#modalDialog" ).dialog({
      height: 200,
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
    $("#modalDialog").html("Uploading<br/><br/><progress id='progressBar' style='width:100%' value='1' max='100'></progress><br/><span id='progressDownload'></span>");
    $.post(json.global.webroot+'/slicerdatastore/upload/generatetoken', {name: $('#nameResource').val(), category: $('#categoryResource').val()}, function(retVal) {
          var jsonRet = jQuery.parseJSON(retVal);
          timer = setTimeout("callbackTimer()",1000);          
          
          window.DataStoreGUI.upload(jsonRet);
       });
    return false;
  });
  
  var availableTags = [];
  $.each( json.upload.availableTags, function(index,value)
    {
    availableTags.push(index);
    });
  
  
  $( "#categoryResource" ).autocomplete({
    source:availableTags
  });
});
