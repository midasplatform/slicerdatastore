var midas = midas || {};
midas.slicerdatastore = midas.slicerdatastore || {};
midas.slicerdatastore.totalResults = -1;

var currentSearch = "";
$(document).ready(function() {
  
     $('img.kwLogo').click(function () {
        var dlgWidth = Math.min($(window).width() * 0.9, 600);
        midas.loadDialog('KWInfo', '/slicerdatastore/index/kwinfo');
        midas.showDialog('Slicer Data Store', false, {width: dlgWidth})
    });
    midas.slicerdatastore.category = json.category;

    midas.slicerdatastore.fetchCategories();
    midas.slicerdatastore.applyFilter();
    
    $('#searchInput').unbind('keyup').keyup(function(){
      if(currentSearch != $(this).val())
        {
        midas.slicerdatastore.pageOffset = 0;
        midas.slicerdatastore.applyFilter(true);
        }
      currentSearch = $(this).val();
    });

});


/**
 * Render the extension result in the result list area
 * @param extension Json-ified slicerpackages_extension dao
 */
midas.slicerdatastore.renderExtension = function(extension, index) {
  
    var url = json.global.webroot+'/slicerdatastore/view?itemId='+extension.id+'&layout='+json.layout;
    var extDiv = $('#extensionTemplate').clone()
      .attr('id', 'extensionWrapper_'+extension.id);
    extDiv.attr('element', extension.id)
    extDiv.attr('bitstream', extension.bitstream_id)
    .attr('extensionname', extension.title);
    extDiv.find('a.extensionName').html(extension.title)
      .attr('qtip', extension.title)
      .attr('element', extension.id)
      .attr('bitstream', extension.bitstream_id)
      .click(function(){
        window.location = url;
      });
    extDiv.find('img.extensionIcon').attr('src', json.global.webroot+'/item/thumbnail?itemId='+extension.id)
      .attr('element', extension.id)
      .attr('bitstream', extension.bitstream_id)
      .attr('extensionname', extension.title)
      .click(function(){
        window.location = url;
      });
    extDiv.find('input.extensionActionButton')
      .attr('element', extension.id)
      .attr('bitstream', extension.bitstream_id)
      .attr('extensionname', extension.title);

    var average = extension.rating.average;
    var starSelect = Math.round(average * 2);
    extDiv.find('div.extensionRatings').find('input[value="'+starSelect+'"]').attr('checked', 'checked');
    extDiv.find('div.extensionRatings').attr('id', 'rating_'+extension.id)
      .stars({
          disabled: true,
          split: 2
      });
    extDiv.find('span.totalVotes').html('('+extension.rating.total+')');
    extDiv.appendTo('#extensionsContainer');
    midas.slicerdatastore.updateExtensionButtonState(extension.title);

    extDiv.fadeIn(200 * index);
}

/**
 * Reset variables, clear 'extensionsContainer' and show loading image.
 */
midas.slicerdatastore.resetFilter = function(){
  midas.slicerdatastore.totalResults = -1;
  midas.slicerdatastore.pageOffset = 0;
  $('.paginationMessage').hide();
  $('.loadingExtensions').show();
  $('#extensionsContainer').html('');
}


midas.slicerdatastore.fetchDatasets = function(){
  var url = json.global.webroot+'/api/json?method=midas.slicerdatastore.listdatasets';

  $.post(url, {category: midas.slicerdatastore.category, query: $('#searchInput').val()}, function(retVal){
    if(retVal.data.offset == 0)
        {
        midas.slicerdatastore.resetFilter();
        }

      midas.slicerdatastore.totalResults = retVal.data.total;
      $.each(retVal.data.items, function(index, extension) {
          midas.slicerdatastore.renderExtension(extension, index);
      });
      if(retVal.data.total == 0) {
          $('.paginationMessage').show().text('No dataset found');
      }
      $('.loadingExtensions').hide();
  }, "json")
}

/**
 * Based on the filter parameters, return a page of extension results
 */
midas.slicerdatastore.applyFilter = function(skipFetchCategories) {
    midas.slicerdatastore.resetFilter();
    midas.slicerdatastore.fetchDatasets();
    if(!skipFetchCategories) {
        midas.slicerdatastore.fetchCategories();
    }
}

/**
 * Render the category tree based on tokens separated by . character
 */
midas.slicerdatastore.showCategory = function(category, count) {
    var tokens = category.split('.');
    var lastToken = '';
    var name = '';
    $.each(tokens, function(k, token) {
        var tokenId = token.replace(/ /g, '_');
        var parentId = lastToken == '' ? 'categoriesList' : 'category_'+lastToken;

        name += token;
        if(lastToken != '') { //subcategory
            lastToken += '_';
            var id = 'category_'+lastToken+tokenId;
            if($('#'+id).length == 0) {
                var html = '<li class="categoryControl" name="'+name+'" id="'+id+'">'+token+' ('+count+')</li>';
                html = '<ul class="categoriesSubList">'+html+'</ul>';
                var el = $('#'+parentId);
                while(el.next().length > 0) {
                    el = el.next(); //insert as last child
                }
                el.after(html);
            }
        } else { //top level category
            var id = 'category_'+tokenId;
            if($('#'+id).length == 0) {
                var html = '<li class="categoryControl" name="'+name+'" id="'+id+'">'+token+' ('+count+')</li>';
                $('#'+parentId).append(html);
            }
        }
        lastToken += tokenId;
        name += '.';
    });
};


midas.slicerdatastore.fetchCategories = function () {
    // Refresh and render the category tree based on all available categories
    ajaxWebApi.ajax({
        method: 'midas.slicerdatastore.categories',
        args: "",
        success: function (retVal) {
          midas.slicerdatastore.categories = retVal.data;
          $('li.categoryControl').remove();
          $.each(midas.slicerdatastore.categories, function(category, count) {
              midas.slicerdatastore.showCategory(category, count);
          });

          // Enable the "All" category filter
          midas.slicerdatastore.selectedCategory = $('li#categoryAll').unbind('click').click(function() {
              midas.slicerdatastore.category = '';
              midas.slicerdatastore.selectedCategory.removeClass('selectedCategory');
              midas.slicerdatastore.selectedCategory = $(this);
              $(this).addClass('selectedCategory');
              $('#searchInput').val('');
              midas.slicerdatastore.applyFilter(true);
          });

          // Enable filtering by specific categories
          $('li.categoryControl').unbind('click').click(function() {
              midas.slicerdatastore.category = $(this).attr('name');
              midas.slicerdatastore.selectedCategory.removeClass('selectedCategory');
              midas.slicerdatastore.selectedCategory = $(this);
              $(this).addClass('selectedCategory');
              midas.slicerdatastore.applyFilter(true);
          });

          var selector = midas.slicerdatastore.category == '' ?
              'li#categoryAll' :
              'li.categoryControl[name="'+midas.slicerdatastore.category+'"]';
          midas.slicerdatastore.selectedCategory = $(selector).addClass('selectedCategory');
        },
        error: function (retVal) {
            alert(retVal.message);
        }
    });
    
};

