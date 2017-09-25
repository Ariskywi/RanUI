/**
 * AutoComplete
 * @class
 * @param {HTMLElement|jQeruyObject} item       目标元素
 * @param {
 *      asyncFilter  {function}                 异步过滤函数(调用方A函数)
 *      onChange     {function}                 选项改变回调
 *      onBlur       {function}                 失去焦点回调
    }      [options]                            参数
 */
var defaultClass = 'ebdp-ebank-anchor';
var dataKey = 'Anchor';

function Anchor(item, options){
    //判断是否是jQuery对象，数组或是单个DOM节点。
    var defaultOption = {
        data: null
    };

    this.options = $.extend(defaultOption, options || {});

    this.main = item;
    this.$main = $(this.main);
    this.init(this.options);
}

Anchor.prototype = {
    /**
     * 初始化
     * @param {Object} options 参数
     * @private
     */
    init:function(options){
        this.$main.addClass('auto-complete');

        // 注册事件
        // this.fuzzyFilter = $.proxy(this.fuzzyFilter, this);
    },
    /**
     * 匹配
     */
    fuzzyFilter: function(searchKey, searchText){
        var compareString = searchText.toLowerCase();
        searchKey = searchKey.toLowerCase();
        var len = searchText.length;
        var searchTextIndex = 0;
        for (var index = 0; index < len; index++) {
            if (searchKey.charAt(searchTextIndex) === compareString.charAt(index)) {
                searchTextIndex++;
            }
        }

        return searchTextIndex === searchKey.length;
    },
    /**
     * 销毁
     */
    destroy: function() {
        this.$main
            .data(dataKey, null)
            .html('');
    }
};
//判断是否已经实例化
$.extend($.fn, {
    Anchor: function(method) {
        var internal_return,
            args = arguments;
        this.each(function() {
            var instance = $(this).data(dataKey);
            if (instance) {
                if (typeof method === 'string' && typeof instance[method] === 'function') {
                    internal_return = instance[method].apply(instance, Array.prototype.slice.call(args, 1));
                    if (internal_return !== undefined) {
                        return false; // break loop
                    }
                }
            } else {
                if (method === undefined || jQuery.isPlainObject(method)) {
                    $(this).data(dataKey, new Anchor(this, method));
                }
            }
        });

        if (internal_return !== undefined) {
            return internal_return;
        } else {
            return this;
        }
    }
});
