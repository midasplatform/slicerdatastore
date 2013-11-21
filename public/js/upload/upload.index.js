var timer = false;
function callbackTimer()
  {
  var stats = window.DataStoreGUI.getStreamStat();
  if(stats == "-1")
    {
    $( "#modalDialog" ).dialog( "close" );
    $( "#modalDialog" ).html('You successfully uploaded the dataset. It will be available in the next few minutes.')
    $( "#modalDialog" ).dialog({
          height: 250,
          width: 500,
          modal: true ,
          resizable: false,
          buttons: {
            Ok: function() {          
              $( this ).dialog( "close" );
              if(json.upload.itemId == -1)
                {
                location.reload();
                }
              else
                {
                window.location.href = json.global.webroot+"/slicerdatastore"
                }
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
  // Edit existing revision
  $('#submitEditButton').click(function(){
    if($('#nameResource').val() == "")
      {
      alert('Please define a name.');
      return;
      }
   var backUrl = $("#backLink").attr('href');
   $(this).after('Please wait...');
   $('input[type=submit]').remove();
   $('input[type=button]').remove();
   var categories = [];
   $('.categoryResource').each(function(){
     if($(this).val() != "")categories.push(capitaliseFirstLetter($(this).val()));
   });
   $.post(json.global.webroot+'/slicerdatastore/upload/', {itemId: json.upload.itemId, name: $('#nameResource').val(), 
     description: CKEDITOR.instances.description.getData(), 
     categories: categories}, function(retVal) {
         window.location.href = backUrl;
       });  
    return false;
  })
  
  // New revision or new dataset
  $('#submitButton').click(function(){
    if($('#nameResource').val() == "")
      {
      alert('Please define a name.');
      return;
      }
    $(this).remove();
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
    $("#modalDialog").html("Uploading<br/><br/><progress id='progressBar' style='width:100%' value='1' max='100'></progress><br/><span id='progressDownload'></span>");
    var categories = [];
    $('.categoryResource').each(function(){
      if($(this).val() != "")categories.push(capitaliseFirstLetter($(this).val()));
    });
    $.post(json.global.webroot+'/slicerdatastore/upload/generatetoken', {itemId: json.upload.itemId, name: $('#nameResource').val(), 
      description: CKEDITOR.instances.description.getData(), 
      changes:$('#changeResource').val(),
      categories: categories}, function(retVal) {
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
  
  $('#addACategory').click(function(){
    $( ".categoryResource:last" ).after('<input style="width:250px;"  type="text" class="categoryResource"/>');
    $( ".categoryResource" ).autocomplete({
      source:availableTags
    });
  });
  
  $( ".categoryResource" ).autocomplete({
    source:availableTags
  });
});


function capitaliseFirstLetter(string)
  {
  return string.charAt(0).toUpperCase() + string.slice(1);
  }