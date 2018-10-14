var timer = false;

function updateStreamStats(stats){
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

function callbackTimer(){
  /* Following will be true when WebEngine is present for Qt5.x  */
  if(typeof qt!='undefined')
  {
    window.DataStoreGUI.getStreamStat(function(stats) {
      updateStreamStats(stats);
    });
  }
  else
  {
    var stats = window.DataStoreGUI.getStreamStat();
    updateStreamStats(stats);
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
    $( ".categoryResource:last" ).parent().append('<input style="width:250px;"  type="text" class="categoryResource"/>');
    initAutocomplete(availableTags);
  });
  
  initAutocomplete(availableTags);
  
  $.each(json.owned, function(index, extension) {
     renderExtension(extension, index);
  });
});

var globalTags = [];
function initAutocomplete(tags)
  {
    globalTags = tags;
    $(".categoryResource").combobox();
  
  /*$( ".categoryResource" ).autocomplete({
    source:tags
  });*/
  }

function capitaliseFirstLetter(string)
  {
  return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  

function renderExtension (extension, index) {
    var extDiv = $('#extensionTemplate').clone()
      .attr('id', 'extensionWrapper_'+extension.item_id);
    extDiv.attr('element', extension.item_id)
    .attr('extensionname', extension.name);
    extDiv.find('span.extensionName').html(extension.name)
      .attr('qtip', extension.name)
      .attr('element', extension.item_id)
     /* .click(midas.slicerdatastore.extensionClick)*/;
    extDiv.find('img.extensionIcon').attr('src', json.global.webroot+'/item/thumbnail?itemId='+extension.item_id)
      .attr('element', extension.item_id)
      .attr('extensionname', extension.name)
    /*  .click(midas.slicerdatastore.extensionClick)*/;
    extDiv.find('input.extensionActionButton')
      .attr('element', extension.item_id)
      .attr('extensionname', extension.name);

    extDiv.appendTo('#listDatasets');
    extDiv.show();
    extDiv.click(function(){
      window.location.href = json.global.webroot+"/slicerdatastore/upload?revision=true&itemId="+extension.item_id;
    })
}


  (function( $ ) {
    $.widget( "custom.combobox", {
      _create: function() {
        this.wrapper = $( "<span>" )
          .addClass( "custom-combobox" )
          .insertAfter( this.element );
 
        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
      },
 
      _createAutocomplete: function() {
        var value = this.element.val();
        this.input = $( "<input>" )
          .appendTo( this.wrapper )
          .val( value )
          .attr( "title", "" )
          .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
          .autocomplete({
            delay: 0,
            minLength: 0,
            source: globalTags
          })
          .tooltip({
            tooltipClass: "ui-state-highlight"
          });
 
        this._on( this.input, {
          keyup: function()
            {
            this.element.val(this.input.val());
            },
          autocompleteselect: function( event, ui ) {
            this._trigger( "select", event, {
              item: ui.item.option
            });
            this.element.val(ui.item.value);
          }
 
        });
      },
 
      _createShowAllButton: function() {
        var input = this.input,
          wasOpen = false;
 
        $( "<a>" )
          .attr( "tabIndex", -1 )
          .attr( "title", "Show All Items" )
          .tooltip()
          .appendTo( this.wrapper )
          .button({
            icons: {
              primary: "ui-icon-triangle-1-s"
            },
            text: false
          })
          .removeClass( "ui-corner-all" )
          .addClass( "custom-combobox-toggle ui-corner-right" )
          .mousedown(function() {
            wasOpen = input.autocomplete( "widget" ).is( ":visible" );
          })
          .click(function() {
            input.focus();
 
            // Close if already visible
            if ( wasOpen ) {
              return;
            }
 
            // Pass empty string as value to search for, displaying all results
            input.autocomplete( "search", "" );
          });
      },

 
      _destroy: function() {
        this.wrapper.remove();
        this.element.show();
      }
    });
  })( jQuery );