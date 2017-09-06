/**
 * AutoComplete
 * @class
 * @param {HTMLElement|jQeruyObject} item              目标元素
 * @param {Object}      [options]                      参数
 */
function AutoComplete(item, options){
    //判断是否是jQuery对象，数组或是单个DOM节点。
    var defaultOption = {
        styles: {
            width: '348px',
            arrow: true
        },
        tips:{
            header:'默认展示前5条匹配结果，请输入更多以精确匹配',
            footer:'请输入更多关键字查询',
        },
        isAtFirstGetData:true,
        url:'http://123.com',
        showNumber:5,
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

var defaultClass = 'ebdp-ebank-auto-complete';
var dataKey = 'AutoComplete';

AutoComplete.prototype = {
    /**
     * 初始化
     * @param {Object} options 参数
     * @private
     */
    init:function(options){
        var _this = this;
        this.tipHeader = this.options.tips.header;
        this.tipFooter = this.options.tips.footer;
        this.inputWidth = this.options.styles.width;
        this.arrow = this.options.styles.arrow;
        this.isAtFirstGetData = this.options.isAtFirstGetData;
        this.url = this.options.url;
        this.showNumber = this.options.showNumber;

        this.$input = $('<input type="text" placeholder="请选择" class="select-input-default" style="width:'+this.inputWidth+';"/>');
        this.$selected = $('<div class="select-selection-selected" style="width:'+this.inputWidth+';"></div>');
        this.$holder = $('<div class="options-holder" style="width:360px;">');
        this.$main.addClass('auto-complete')
            .append(this.$selected)
            .append(this.$input);

        this.fiterdata = this.filterData(this.getAllData(''));
        console.log(this.fiterdata)
        if(this.isAtFirstGetData && this.url.length !=0){
            //当只有一条数据时，回显
            if(this.fiterdata.length == 1){
                this.$selected.text(this.fiterdata[0].text)
                    .attr({value: this.fiterdata[0].value});
            }else {
                this.setData(this.fiterdata);
            }

        }else {
            if(this.url.length == 0){
                alert('请配置select的url')
            }else {
                //调用方获得值后实现A函数，传给B函数后再渲染
            }
        }

        // if(this.arrow){
        //     this.$input.addClass('select-input-arrow');
        // }

        this.currentOption = null;

        this.$input.on('click', function(e){
            _this.toggle();
        });
        this.$input.on('keyup',$.proxy(this,'keywordSearch'));

        this.$holder.on('click', function(e){
            _this.click.call(_this, e);
        });

        this.$selected.on('click', function(e){
            _this.toggle();
            // _this.$input.focus();
            console.log(_this.arrow)
            _this.$input.attr('class','select-input-checked');
            // if(_this.arrow){
            //     _this.$input.attr('class','select-input-checked'+' select-input-arrowUp');
            // }else {
            //     _this.$input.attr('class','select-input-checked');
            // }

        });
        this.$input.focus(function(e){
            $(_this).attr('placeholder',"");
            console.log($(_this).attr('placeholder'))
        })

        this.$input.blur(function(e){
            $(_this).attr('placeholder',"请选择!!!");
            console.log($(_this).attr('placeholder'))
        })
    },
    /**
     * 设置选项
     * @data {array} options 选项
     */
    setData: function(data){
        var _this = this;
        this.$holder.empty();
        if(_this.tipHeader.length != 0){
            _this.$holder.append('<div class="options-select-tipHeader">'+_this.tipHeader+'</div>')
        }
        $.each(data, function(index, option){
            var newOption = $('<div class="options"></div>').text(option.text)
                .attr({value: option.value});
            _this.$holder.append(newOption);
            _this.$main.append(_this.$holder);
        });
        if(_this.tipFooter.length != 0 && this.getAllData().length > this.showNumber){
            _this.$holder.append('<div class="options-select-tipFooter">'+_this.tipFooter+'</div>')
        }
    },
    /**
     * 获取数据
     * @url {String} options 选项
     * @return {String}
     */
    getAllData:function () {
        var _this = this;

        this.data= [{
            text: '请选择测试超过宽度的样式',
            value: -1,
            isDefault:false
        },{
            text: 'option1',
            value: 1,
            isDefault:false
        },{
            text: 'option2',
            value: 2,
            isDefault:false
        },{
            text: 'option3',
            value: 3,
            isDefault:false
        },{
            text: 'option4',
            value: 4,
            isDefault:false
        },{
            text: 'option5',
            value: 5,
            isDefault:false
        },{
            text: 'option6',
            value: 6,
            isDefault:false
        }];

        $.ajax({
            url:_this.url,
            type:'POST',
            data:{key:_this.getValue()},
            dataType:'json',
            success:function (msg) {
                
            }
        })
        return this.data;
    },
    filterData:function (json) {
        var _this = this;
        var filterData = [];
        var temp = [];
        for(var i=0;i<_this.showNumber;i++){
            for(var key in json[i]){
                temp.push({[key]:json[i][key]});
            }
            filterData.push(temp);
        }
        return filterData;
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
                console.log(lpu + ":" + ctop + ":"+ (lpu))
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
     * 获取当前项
     * @data {array} options 选项
     */
    getSelection: function(){
        return this.currentOption;
    },
    /**
     * 点击处理
     */
    click: function(e){
        var $current = $(e.target);
        if ($current.hasClass('options')) {
            if ($current.val() < 0 ) {
                return;
            }
            this.currentOption = {
                text: $current.text(),
                value: $current.val()
            }
            this.$selected.text($current.text())
                .attr({value: $current.val()});
            this.toggle();
            this.options.onClick && _this.options.onClick();
        }
    },
    /**
     * 切换
     */
    toggle: function(){
        this.$selected.toggle();
        this.$holder.toggle();
    },
    /**
     * 获取选中的 value 值
     * @return {String}
     */
    getValue: function() {
        //输入停顿X秒后，获得值
        return this.$selected.attr('value') || -1;
    },
    /**
     * 获取选中的 text 值
     * @return {String}
     */
    getText: function() {
        return this.$selected.html();
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

$(document).ready(function(){
    $('.new-auto-complete').AutoComplete();
});