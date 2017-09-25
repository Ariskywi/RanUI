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
var defaultClass = 'ebdp-ebank-auto-complete';
var dataKey = 'AutoComplete';

function AutoComplete(item, options){
    //判断是否是jQuery对象，数组或是单个DOM节点。
    var defaultOption = {
        styles: {
            width: 350,
            arrow: true
        },
        showDel: true,          // 删除
        orderChange: true,      // 是否可移动
        latterTime: 1000,
        header:'默认展示前5条匹配结果，请输入更多以精确匹配',
        footer:'请输入更多关键字查询',
        data: [{
            text: '请选择',
            value: -1
        }],
        showNumber: 999999
    };

    this.options = $.extend(defaultOption, options || {});

    this.main = item;
    this.$main = $(this.main);
    this.init(this.options);
}

AutoComplete.prototype = {
    /**
     * 初始化
     * @param {Object} options 参数
     * @private
     */
    init:function(options){
        // 初始化标记
        this.timer = null;
        this.blurTimer = null;      // blur时是否关闭
        this.focusTimer = null;
        this.action = null;
        this.currentOption = null;

        // 添加dom节点
        this.$input = $('<input type="text" class="select-input-default" />');
        this.$selected = $('<div class="select-selection-selected"></div>');
        this.$holder = $('<div class="options-holder hidden">');
        this.$main.addClass('auto-complete')
            .append(this.$selected)
            .append(this.$input)
            .append(this.$holder);

        // 设定配置项
        this.options.data && this.setData(this.options.data);
        this.setPlaceholder();

        // 注册事件
        this.inputFocus         = $.proxy(this.inputFocus, this);
        this.inputBlur          = $.proxy(this.inputBlur, this);
        this.inputChange        = $.proxy(this.inputChange, this);
        this.selectedClick      = $.proxy(this.selectedClick, this);
        this.holderClick        = $.proxy(this.holderClick, this);
        this.holderMouseOver    = $.proxy(this.holderMouseOver, this);
        this.holderMouseOut     = $.proxy(this.holderMouseOut, this);

        this.$input
            .on('focus', this.inputFocus)
            .on('blur', this.inputBlur)
            .on('keydown', this.inputChange);
            // .on('input', this.inputChange)
            // .on('propertychange', this.inputChange);

        this.$holder
            .on('click', this.holderClick)
            .on('mouseover',this.holderMouseOver)
            .on('mouseout',this.holderMouseOut);

        this.$selected.on('click', this.selectedClick);
    },
    removeAllHoverStyle: function(){
        this.$holder.find('.hover').removeClass('hover');
        return this;
    },
    /**
     * option悬停样式
     */
    holderMouseOver: function(e){
        this.removeAllHoverStyle();
        var $current = $(e.target);
        if ($current.hasClass('.option-holder')) {
            $current.addClass('hover');
        }else{
            $current.closest('.option-holder').addClass('hover');
        }
    },
    /**
     * option移除样式
     */
    holderMouseOut: function(e){
        $(e.target).removeClass('hover');
    },
    /**
     * input focus
     */
    inputFocus: function(e){
        var _this = this;
        this.$selected.hide();
        this.focusTimer = setTimeout(function(){
            if (_this.action !== 'select'){
                _this.setData(_this.options.data);
                _this.$holder.removeClass('hidden');
                _this.action = 'focus';
            }
        }, this.options.latterTime);
    },
    /**
     * input blur
     */
    inputBlur: function(e){
        var _this = this;
        clearTimeout(this.focusTimer);
        // 延迟触发,保证blur触发在option的click之后
        this.blurTimer = setTimeout(function(){
            if (_this.action === 'auto' || _this.action === 'blur' || _this.action === 'select'){
                return;
            }else{
                _this.action = 'blur';
                // 如果不是点击选项关闭，则设置输入框内的值
                var searchKey = _this.getSearchKey();
                var newOption = null;
                if (searchKey !== '') {
                    // 不在待选项中
                    var index = _this.findOption(searchKey);
                    if ( index < 0) {
                        newOption = {
                            text: searchKey,
                            value: searchKey
                        }
                    }else{
                        newOption = _this.options.data[index];
                    }
                }
                _this.setSelection(newOption);
            }
        }, 200);
        this.options.onBlur && this.options.onBlur();
    },
    /**
     * input keydown
     */
    inputChange: function(e){
        var _this = this;
        if (e.keyCode === 37 || e.keyCode === 39) {
            return;
        }
        this.action = 'keypress-' + e.keyCode;
        clearTimeout(_this.timer);
        this.timer = setTimeout(function(){
            if (_this.options.asyncFilter) {
                _this.options.asyncFilter(_this.getSearchKey());
            }else{
                _this.options.data && _this.setData(_this.options.data);
            }
        }, this.options.latterTime);
    },
    /**
     * selected click
     */
    selectedClick: function(e){
        this.action = 'active';
        this.$input[0].select();     // 会触发input的focus
        this.$input.removeClass('select-input-default').addClass('select-input-checked');
    },
    /**
     * 点击处理
     */
    holderClick: function(e){
        var $current = $(e.target);
        var $option = null;
        clearTimeout(this.blurTimer);
        if ($current.hasClass('option-holder')) {
            $option = $current.children('.options');
        }else if ($current.hasClass('options')) {
            $option = $current;
            // .closest('.option-holder').children('.options');
        }
        if ($option !== null) {
            this.action = 'select';
            if ($option.val() < 0 ) {
                return;
            }
            this.setSelection({
                text: $option.text(),
                value: $option.val()
            });
            $('.options').removeClass('selected');
            $option.addClass('selected');
        }else{
            this.$input.focus();
        }
    },
    /**
     * 设置当前选择项
     */
    setSelection: function(option){
        if (option === null) {
            this.currentOption = option;
            this.$input.val('');
            this.setPlaceholder();
            this.$selected.addClass('placeholder');
        }else{
            this.currentOption = {
                text: option.text,
                value: option.value
            }
            this.$input.val(option.text);
            this.$selected.text(option.text)
                .attr({value: option.value})
                .removeClass('placeholder');
        }

        this.$holder.addClass('hidden');
        this.$selected.show();
        // 主动触发blur,使过程可控
        this.$input.blur();
        this.options.onChange && this.options.onChange(this.getSelection());
        // clearTimeout(this.blurTimer);
    },
    /**
     * 设置样式
     * @data {obj} styles 样式项
     */
    setStyles: function(){
        var styles = this.options.styles;
        var realWidth = 0;
        this.$holder.find('.options').each(function(index, option){
            if ($(option).width() > realWidth) {
                realWidth = $(option).width();
            }
        });
        if (styles.arrow) {
            this.$input.addClass('showArrow');
            this.$selected.addClass('showArrow');
        }
        if (styles.width) {
            this.$main.css({width: styles.width});
            this.$input.css({width: styles.width});
            this.$selected.css({width: styles.width});
            this.$holder.css({width: realWidth <= (styles.width - 200) ? styles.width : (realWidth + 200)});
        }
    },
    /**
     * 设置选项
     * @data {array} options 选项
     */
    setData: function(data){
        var _this = this;

        this.options.data = data;
        var filterData = this.filterData(data);
        this.filteredData = filterData;

        this.$holder.empty();
        this.$holder.css({width: 'auto'});
        $.each(filterData, function(index, option){
            if (index >= _this.options.showNumber) {
                return ;
            }
            var $optionHolder   = $('<div class="option-holder"></div>');
            var $delBtn         = $('<span class="del">删除</span>');
            var $upOrder        = $('<span class="up-arrow">↑</span>');
            var $downOrder      = $('<span class="down-arrow">↓</span>');
            var $pos            = $('<span class="parallel">-</span>');     // 占位
            var $newOption      = $('<span class="options"></span>')
                .text(option.text)
                .attr({value: option.value});

            $optionHolder.append($newOption);
            _this.options.showDel && $optionHolder.append($delBtn);
            if (_this.options.orderChange) {
                var minLen = _this.options.showNumber > filterData.length ? filterData.length : _this.options.showNumber;
                if (index !== minLen -1 ) {
                    $optionHolder.append($downOrder);
                }else{
                    $optionHolder.append($pos);
                }
                if (index !== 0) {
                    $optionHolder.append($upOrder);
                }else{
                    $optionHolder.append($pos);
                }
            }
            _this.$holder.append($optionHolder);
        });

        if (filterData.length === 1 && /keypress/.test(this.action) && filterData[0].value > 0){
            var actionInfo = this.action.split('-');
            if (actionInfo[1] != 8 && actionInfo[1] != 46){
                this.action = 'auto';
                this.setSelection(filterData[0]);
            }
        }
        if (this.options.header && filterData.length > 0){
            var headerOption = $('<div class="options-select-tip"></div>')
                .text(this.options.header)
                .attr({value: -2});
            this.$holder.prepend(headerOption);
        }
        if (this.options.showNumber && filterData.length > this.options.showNumber){
            var overOption = $('<div class="options-select-tip"></div>')
                .text(this.options.footer || '请输入更多关键字查询')
                .attr({value: -3});
            this.$holder.append(overOption)
        }
        this.setStyles();
    },
    /**
     * 过滤数据
     */
    filterData: function (data) {
        var filterData = [];
        var searchKey = this.getSearchKey();
        var len = data.length;
        if (searchKey) {
            for (var i = 0; i < len; i++) {
                if (this.fuzzyFilter(searchKey, data[i].text)) {
                    filterData.push(data[i]);
                }
            }
            return filterData;
        }else{
            return data;
        }
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
    findOption: function(searchKey){
        var index = -1;
        var data = this.options.data;
        var len = data.length;
        for (var i = 0; i < len; i++) {
            if (searchKey == data[i].text) {
                index = i;
                break;
            }
        }
        return index;
    },
    /**
     * 获取当前项
     * @data {array} options 选项
     */
    getSelection: function(){
        return this.currentOption;
    },

    getSearchKey: function(){
        var searchKey = $.trim(this.$input.val());
        this.searchKey = searchKey;
        return searchKey;
    },
    /**
     * 获取选中的 value 值
     * @return {String}
     */
    getValue: function() {
        return this.currentOption.value;
    },
    /**
     * 获取选中的 text 值
     * @return {String}
     */
    getText: function() {
        return this.currentOption.text;
    },
    /**
     * 设置placeholder
     */
    setPlaceholder: function(){
        var searchKey = this.getSearchKey();
        if (searchKey === null || searchKey === '') {
            this.$selected.text(this.options.placeholder || '请选择').addClass('placeholder');
        }
    },
    /**
     * 销毁
     */
    destroy: function() {
        this.$input
            .off('focus', this.inputFocus)
            .off('blur', this.inputBlur)
            .off('keydown', this.inputChange)
            .remove();

        this.$holder
            .off('click', this.holderClick)
            .off('mouseover',this.holderMouseOver)
            .off('mouseout',this.holderMouseOut)
            .remove();

        this.$selected
            .off('click', this.selectedClick)
            .remove();
        this.$main
            .data(dataKey, null)
            .html('');
    }
};
//判断是否已经实例化
$.extend($.fn, {
    AutoComplete: function(method) {
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
                    $(this).data(dataKey, new AutoComplete(this, method));
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
