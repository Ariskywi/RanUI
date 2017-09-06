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
            width: '150px'
        },
        data: [{
            text: '请选择',
            value: -1
        },{
            text: 'option1',
            value: 1
        },{
            text: 'option2',
            value: 2
        }]
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

        this.$input = $('<input type="text" placeholder="请选择" />');
        this.$selected = $('<div class="select-selection-selected"></div>');
        this.$holder = $('<div class="options-holder">');
        this.$main.addClass('auto-complete')
            .append(this.$selected)
            .append(this.$input);
        this.setData(this.options.data);

        this.currentOption = null;

        this.$input.on('click', function(e){
            _this.toggle();
        });

        this.$holder.on('click', function(e){
            _this.check.call(_this, e);
        });

        this.$selected.on('click', function(e){
            _this.toggle();
            _this.$input.focus();
        });
    },
    /**
     * 设置选项
     * @data {array} options 选项
     */
    setData: function(data){
        var _this = this;
        this.$holder.empty();
        $.each(data, function(index, option){
            var newOption = $('<div class="options"></div>').text(option.text)
                            .attr({value: option.value});
            _this.$holder.append(newOption);
            _this.$main.append(_this.$holder);
        });
    },
    /**
     * 获取当前项
     * @data {array} options 选项
     */
    getSelection: function(){
        return this.currentOption;
    },
    /**
     * 选择
     */
    check: function(e){
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
     * 激活
     */
    enable: function() {
        this.main.disabled = false;
        this.$label.attr('class', defaultClass + ' ebdp-ebank-radio-' + (this.main.checked ? checked : unChecked));
        this.click();
    },
    /**
     * 禁用
     */
    disable: function() {
        this.main.disabled = true;
        this.$label.attr('class', defaultClass+' ebdp-ebank-radio-unchecked-disabled');
        this.$label.off('click');
    },
    /**
     * 获取选中的 value 值
     * @return {String}
     */
    val: function() {
        var value = '';
        this.$group.each(function(index, element) {
            if (element.checked) {
                value = $(element).val();
                return false;
            }
        });
        return value;
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
