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
        latterTime: 1000,
        header:'默认展示前5条匹配结果，请输入更多以精确匹配',
        footer:'请输入更多关键字查询',
        data: [{
            text: '请选择',
            value: -1
        }],
        showNumber: 5
    };

    this.options = $.extend(defaultOption, options || {});

    if (item instanceof jQuery) {
        item.each(function(index, ele){
            new AutoComplete(ele, options);
            return this;
        });
    }else{
        if (item instanceof Array) {
            for (var i = item.length - 1; i >= 0; i--) {
                new AutoComplete(item[i], options);
                return this;
            }
        }else{
            this.main = item;
            this.$main = $(this.main);
            this.init(this.options);
        }
    }
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
        this.$holder = $('<div class="options-holder">');
        this.$main.addClass('auto-complete')
            .append(this.$selected)
            .append(this.$input)
            .append(this.$holder);

        // 设定配置项
        this.options.data && this.setData(this.options.data);
        if (this.options.styles) {
            this.setStyles();
        }
        this.setPlaceholder();

        // 注册事件
        this.inputFocus = this.inputFocus.bind(this);
        this.inputBlur = this.inputBlur.bind(this);
        this.inputKeydown = this.inputKeydown.bind(this);
        this.selectedClick = this.selectedClick.bind(this);
        this.holderClick = this.holderClick.bind(this);
        this.holderMouseOver = this.holderMouseOver.bind(this);
        this.holderMouseOut = this.holderMouseOut.bind(this);

        this.$input
            .on('focus', this.inputFocus)
            .on('blur', this.inputBlur)
            .on('keydown', this.inputKeydown);

        this.$holder
            .on('click', this.holderClick)
            .on('mouseover',this.holderMouseOver)
            .on('mouseout',this.holderMouseOut);

        this.$selected.on('click', this.selectedClick);
    },
    removeAllHoverStyle: function(){
        this.$holder.find(".options").removeClass("hover");
        return this;
    },
    /**
     * option悬停样式
     */
    holderMouseOver: function(e){
        this.removeAllHoverStyle();
        $(e.target).addClass('hover');
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
        this.focusTimer = setTimeout(function(){
            if (_this.action !== 'select'){
                _this.setData(_this.options.data);
                _this.$holder.show();
                _this.action = 'focus';
            }
        }, this.options.latterTime);
    },
    /**
     * input blur
     */
    inputBlur: function(e){
        var _this = this;
        // 延迟触发,保证blur触发在option的click之后
        this.blurTimer = setTimeout(function(){
            // if (_this.action === 'auto' || _this.action === 'blur'){
            //     return;
            // }
            _this.action = 'blur';
            if (_this.$holder.is(':visible')) {
                _this.$selected.show();
                _this.$holder.hide();
            }else{
                _this.$selected.show();
            }
            // 如果不是点击选项关闭，则设置输入框内的值
            // var searchKey = _this.getSearchKey();
            // var newOption = null;
            // if (searchKey === '') {
            //     if (_this.currentOption !== null) {
            //         newOption = {
            //             text: _this.currentOption.text,
            //             value: _this.currentOption.text
            //         }
            //     }
            // }else{
            //     newOption = {
            //         text: searchKey,
            //         value: searchKey
            //     }
            // }
            // _this.setSelection(newOption);
            clearTimeout(_this.focusTimer);
        }, 200);
        this.options.onBlur && this.options.onBlur();
    },
    /**
     * input keydown
     */
    inputKeydown: function(e){
        var _this = this;
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
        this.$selected.hide();
        this.$input.focus();
        this.$input.removeClass('select-input-default').addClass('select-input-checked');
    },
    /**
     * 点击处理
     */
    holderClick: function(e){
        this.action = 'select';
        var $current = $(e.target);
        clearTimeout(this.blurTimer);
        if ($current.hasClass('options')) {
            if ($current.val() < 0 ) {
                return;
            }
            this.setSelection({
                text: $current.text(),
                value: $current.val()
            });
            $('.options').removeClass('selected');
            $current.addClass('selected');
            this.options.onChange && this.options.onChange(this.getSelection());
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

        this.$holder.hide();
        this.$selected.show();
        this.$input.blur();
        // clearTimeout(this.blurTimer);
    },
    /**
     * 设置样式
     * @data {obj} styles 样式项
     */
    setStyles: function(){
        var styles = this.options.styles;
        if (styles.arrow) {
            this.$input.addClass('showArrow');
            this.$selected.addClass('showArrow');
        }
        if (styles.width) {
            this.$main.css({width: styles.width});
            this.$input.css({width: styles.width});
            this.$selected.css({width: styles.width});
            this.$main.find('.options').css({width: styles.width});
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
        $.each(filterData, function(index, option){
            if (index >= _this.options.showNumber) {
                return ;
            }
            var newOption = $('<div class="options"></div>')
                .text(option.text)
                .attr({value: option.value});
            _this.$holder.append(newOption);
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

        var searchTextIndex = 0;
        for (var index = 0; index < searchText.length; index++) {
            if (compareString[index] === searchKey[searchTextIndex]) {
                searchTextIndex += 1;
            }
        }

        return searchTextIndex === searchKey.length;
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
     * 切换待选框
     */
    // toggleHolder: function(){
    //     this.$holder.toggle();
    // },
    /**
     * 切换已选
     */
    // toggleSelected: function(){
    //     this.$selected.toggle();
    //     if (this.$selected.is(':visible')) {
    //         this.setPlaceholder();
    //     }
    // },

    /**
     * 设置placeholder
     */
    setPlaceholder: function(){
        var searchKey = this.getSearchKey();
        if (searchKey === null || searchKey === '') {
            this.$selected.text(this.options.placeholder || '请选择').addClass('placeholder');
        }
    },
    //关键词搜索
    keywordSearch: function(e){
        var keyword = $(e.currentTarget).val();
        //传给过滤函数

        if(!keyword){
            //渲染列表
        }

        function getCurrentHoverItem(){
            var list = this.$list.find("li.hover");
            return list.length ? list : null;
        }
        function setListScroll(li){
            var ctop = this.$list.scrollTop(), h = 320, pd = 4, lih = 24, index = this.$list.find("li").index(li),
                lpd = (index + 2) * lih + pd, lpu = index*lih +pd;

            if(lpu < ctop){
                this.$list.scrollTop(Math.max(0, lpu));
            }else if(lpd > h + ctop){
                this.$list.scrollTop(lpd - h)
            }
            return this;
        }
        //支持键盘上线选择和回车导入
        if(e.keyCode == 13){//选中，触发select事件
            var li = getCurrentHoverItem.call(this);
            li && li.click();
        }else if(e.keyCode == 38){//上移
            var li = getCurrentHoverItem.call(this);
            this._removeAllHoverStyle();

            if(li){
                var prev = li.prev();
                if(prev.length){
                    li = li.removeClass("hover").prev().addClass("hover");
                }else{
                    li.addClass("hover");
                }
            }else{
                li = this.$list.find("li").first().addClass("hover");
            }
            setListScroll.call(this, li);
        }else if(e.keyCode == 40){//下移
            var li = getCurrentHoverItem.call(this);
            this._removeAllHoverStyle();

            if(li){
                var next = li.next();
                if(next.length){
                    li = li.removeClass("hover").next().addClass("hover");
                }else{
                    li.addClass("hover");
                }
            }else{
                li = this.$list.find("li").first().addClass("hover");
            }
            setListScroll.call(this, li);
        }
    },
    /**
     * 销毁
     */
    destroy: function() {
        this.$label.off('click').remove();
        this.$main.data(dataKey, null);
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
