var midas = midas || {};
midas.slicerdatastore = midas.slicerdatastore || {};

var json = null;

/**
 * Renders the category of this extension as a breadcrumb bar
 */
midas.slicerdatastore.renderCategory = function(category) {
    var currToken = '';
    // if this extension belongs to multiple categories, we just render the first one
    category = category[0];
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
        .attr('bitstream', json.bitstream.bitstream_id)
        .attr('extensionname', json.item.name);
    midas.slicerdatastore.updateExtensionButtonState(json.item.name);

    
    $('#revisionLink').click(function(){
      $('#dialogRevision').dialog({
        width:630
      });
     $('input.revisionActionButton').each(function(){
       $(this).attr('element', json.item.item_id)
          .attr('bitstream', $(this).attr('bitstream'))
          .attr('extensionname', json.item.name+"_"+$(this).attr('revision'));
      midas.slicerdatastore.updateExtensionButtonState(json.item.name+"_"+$(this).attr('revision'));
     })
        
    })
    
    $('#datasetUrl').click(function(){
      $('#dialogUrl').dialog({
        width:450
      });
      $('#dialogUrl input').select();
      $('#dialogUrl input').click(function(){
        $(this).select();
      })
    })

    $('#commentsDiv h4').remove();
    $('#ratingsDiv h4').remove();
    $('#ratingsUser').appendTo('#ratingsDiv');
    $('div.loginToRate').appendTo('#ratingsDiv');
    $('div.loginToRate').css('float', 'left');

    var url = json.global.webroot+'/slicerdatastore';

    $('#rootBreadcrumb').attr('href', url);
    
    $('#deleteDataSet').click(function(){
      if(confirm("Do you really want to delete the dataset?"))
        {
        window.location.href = url+"/view?itemId="+json.item.item_id+"&delete=true";
        }
    })
    
     $("a.generatedLink").each(function () {
        var t = $(this).text();
        if(t.length > 30) {
          $(this).text(t.replace(/\./g,". ").replace(/\//g, "/ "));
        }
      });
      
      
    midas.registerCallback('CALLBACK_RATINGS_AFTER_LOAD', 'ratings', function() {
        $('#loginToComment,#loginToRate').unbind('click').click(function(){
          window.location.href = json.global.webroot+"/slicerdatastore/user/login?previousUri="+json.global.currentUri;
        });
        $('#registerToComment,#registerToRate').unbind('click').click(function(){
          window.location.href = json.global.webroot+"/slicerdatastore/user/login?register=true&previousUri="+json.global.currentUri;
        });
    });
});
