var midas = midas || {};
midas.slicerdatastore = midas.slicerdatastore || {};
midas.slicerdatastore.totalResults = -1;
midas.slicerdatastore.pageOffset = 0;
midas.slicerdatastore.scrollPaginationInitialized = false;

/**
 * Called when a user clicks to view the extension page
 */
midas.slicerdatastore.extensionClick = function() {
  var url = json.global.webroot+'/slicerdatastore/view?itemId='+$(this).attr('element')+'&layout='+json.layout;
  window.location = url;
}

/**
 * Render the extension result in the result list area
 * @param extension Json-ified slicerpackages_extension dao
 */
midas.slicerdatastore.renderExtension = function(extension, index) {
    var extDiv = $('#extensionTemplate').clone()
      .attr('id', 'extensionWrapper_'+extension.id);
    extDiv.attr('element', extension.id)
    .attr('extensionname', extension.title);
    extDiv.find('a.extensionName').html(extension.title)
      .attr('qtip', extension.title)
      .attr('element', extension.id)
      .click(midas.slicerdatastore.extensionClick);
    extDiv.find('img.extensionIcon').attr('src', json.global.webroot+'/item/thumbnail?itemId='+extension.id)
      .attr('element', extension.id)
      .attr('extensionname', extension.title)
      .click(midas.slicerdatastore.extensionClick);
    extDiv.find('input.extensionActionButton')
      .attr('element', extension.id)
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

/**
 * Return the ideal number of items required to fill the space horizontally.
 */
midas.slicerdatastore.idealNumberOfHorizontalItems = function(){
  var itemWidth = $('#extensionTemplate').outerWidth(true);
  var horizontalCount = Math.floor($('#extensionsContainer').width() / itemWidth);
  return horizontalCount;
}

/**
 * Return the ideal number of items required to fill the space vertically.
 */
midas.slicerdatastore.idealNumberOfVerticalItems = function(){
  var itemHeight = $('#extensionTemplate').outerHeight(true);
  var verticalCount = Math.floor(($(window).height() - $('.extensionsHeader').height()) / itemHeight);
  return verticalCount;
}

/**
 * Return the ideal number of items required to fill the space horizontally and vertically.
 */
midas.slicerdatastore.idealNumberOfItems = function(){
  return midas.slicerdatastore.idealNumberOfHorizontalItems() *
      midas.slicerdatastore.idealNumberOfVerticalItems();
}

/**
 * Compute number of items to fetch based on available width and height.
 * If no items have been fetched, number of items filling the available space plus an
 * extra row will be returned.
 * If items have already been fetched, number of items filling one row will be returned.
 */
midas.slicerdatastore.pageLimit = function(){
    var pageLimit = midas.slicerdatastore.idealNumberOfHorizontalItems();
    if (midas.slicerdatastore.totalResults == -1){
        pageLimit += midas.slicerdatastore.idealNumberOfItems();
    }
    return pageLimit;
}

/**
 * Return loading option to associate with scrollpagination callback.
 * @pageLimit By default, the pageLimit value will be retrieved using function midas.slicerdatastore.pageLimit()
 */
midas.slicerdatastore.scrollPaginationOptions = function(pageLimit){
return {
  'contentPage': json.global.webroot+'//api/json?method=midas.slicerdatastore.listdatasets',
  'contentData': function(){
    var currentPageLimit = typeof pageLimit !== 'undefined' ? pageLimit : midas.slicerdatastore.pageLimit();
    contentData = {
      category: midas.slicerdatastore.category,
      os: midas.slicerdatastore.os,
      arch: midas.slicerdatastore.arch,
      query: $('#searchInput').val(),
      //release: midas.slicerdatastore.release,
      revision: midas.slicerdatastore.revision,
      limit: currentPageLimit,
      offset: midas.slicerdatastore.pageOffset
    };
    midas.slicerdatastore.pageOffset += currentPageLimit;
    // Stop fetch on scroll if "not the first query" and "all items have been fetched"
    if (midas.slicerdatastore.totalResults != -1 &&
        midas.slicerdatastore.pageOffset >= midas.slicerdatastore.totalResults){
        $('#extensionsContainer').stopScrollPagination();
    }
    return contentData;
  },
  'scrollTarget': $(window),
  'heightOffset': 20,
  'dataType':'json',
  'onSuccess': function(obj, retVal){
      if(retVal.data.offset == 0)
        {
        midas.slicerdatastore.resetFilter();
        }
      midas.slicerdatastore.totalResults = retVal.data.total;
      $.each(retVal.data.items, function(index, extension) {
          midas.slicerdatastore.renderExtension(extension, index);
      });
      if(retVal.data.total == 0) {
          $('.paginationMessage').show().text('No extensions found');
      }
  },
  'afterLoad': function(elementsLoaded){
      $('.loadingExtensions').hide();
  }
};
}

/**
 * Initialize scroll pagination
 */
midas.slicerdatastore.initScrollPagination = function(){
    if(midas.slicerdatastore.scrollPaginationInitialized){
        return;
    }

    // If it applies, fetch additonal items upon window resize
    $(window).resize(function(){
        // See http://stackoverflow.com/questions/4298612/jquery-how-to-call-resize-event-only-once-its-finished-resizing
        clearTimeout(this.id);
        this.id = setTimeout(function(){
            current_count = $('#extensionsContainer .extensionWrapper').length;
            if (midas.slicerdatastore.totalResults != -1
                  && midas.slicerdatastore.totalResults != current_count) {
                ideal_count = midas.slicerdatastore.idealNumberOfItems() + midas.slicerdatastore.idealNumberOfHorizontalItems();
                complement_count = current_count % midas.slicerdatastore.idealNumberOfHorizontalItems();
                item_to_fetch = 0;
                if (current_count < ideal_count){
                    item_to_fetch = ideal_count - current_count;
                } else if (complement_count > 0){
                    item_to_fetch = midas.slicerdatastore.idealNumberOfHorizontalItems() - complement_count;
                }
                if (item_to_fetch > 0){
                    $.fn.scrollPagination.loadContent(
                        $('#extensionsContainer'), midas.slicerdatastore.scrollPaginationOptions(item_to_fetch), true);
                }

            }
        }, 500);
    });

    midas.slicerdatastore.resetFilter();
    $('#extensionsContainer').scrollPagination(midas.slicerdatastore.scrollPaginationOptions());
    midas.slicerdatastore.scrollPaginationInitialized = true;
}

/**
 * Based on the filter parameters, return a page of extension results
 */
midas.slicerdatastore.applyFilter = function(skipFetchCategories) {
    midas.slicerdatastore.resetFilter();
    if(window.history && typeof window.history.replaceState == 'function') {
        var params = '?os=' + window.encodeURIComponent(midas.slicerdatastore.os);
        params += '&arch=' + window.encodeURIComponent(midas.slicerdatastore.arch);
        params += '&revision=' + window.encodeURIComponent(midas.slicerdatastore.revision);
        params += '&category=' + window.encodeURIComponent(midas.slicerdatastore.category);
        params += '&layout=' + json.layout;
        window.history.replaceState({
            os: midas.slicerdatastore.os,
            arch: midas.slicerdatastore.arch,
            revision: midas.slicerdatastore.revision,
            category: midas.slicerdatastore.category,
            layout: json.layout
        }, '', params);
    }
    if ($.support.pageVisibility){
        $('#extensionsContainer').startScrollPagination();
    } else {
        $.fn.scrollPagination.loadContent(
            $('#extensionsContainer'), midas.slicerdatastore.scrollPaginationOptions(/*pageLimit = */ 0), true);
    }
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

/**
 * Called when the categories have been loaded or refreshed
 */
midas.slicerdatastore.categoriesLoaded = function () {
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
};

midas.slicerdatastore.fetchCategories = function () {
    // Refresh and render the category tree based on all available categories
    ajaxWebApi.ajax({
        method: 'midas.slicerdatastore.categories',
        args: "",
        success: function (retVal) {
          midas.slicerdatastore.categories = retVal.data;
          midas.slicerdatastore.categoriesLoaded();
        },
        error: function (retVal) {
            alert(retVal.message);
        }
    });
    
};

var currentSearch = "";
$(document).ready(function() {
    midas.slicerdatastore.category = json.category;

    midas.slicerdatastore.fetchCategories();
    // Setup scroll pagination and fetch results based on the initial settings
    if ($.support.pageVisibility){
        if(!midas.slicerdatastore.isPageHidden()){
            midas.slicerdatastore.initScrollPagination();
        } else {
            $(document).bind("show", function(){
              midas.slicerdatastore.initScrollPagination();
              $(document).unbind("show");
            });
        }

    }
    else {
      // If visibility API is not supported, fetch all extensions
      midas.slicerdatastore.applyFilter();
    }
    
    $('#searchInput').unbind('keyup').keyup(function(){
      if(currentSearch != $(this).val())
        {
        console.log('tt');
        midas.slicerdatastore.pageOffset = 0;
        midas.slicerdatastore.applyFilter(true);
        }
      currentSearch = $(this).val();
    });

});
