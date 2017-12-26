(function() {

    // 每次keydown都更新的which，用来对比响应的keyup中的which，如果up和down的which不统一，则进行特殊处理
    var lastKeyDownWhich = -1;

    // 每次keydown的光标位置
    var lastPosition = -1;

    // 兼容IE8的indexOf
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(el) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === el) {
                    return i;
                }
            }
            return -1;
        };
    }

    var _setSelectionRange = function(input, selectionStart, selectionEnd) {
        if (input.setSelectionRange) {
            input.setSelectionRange(selectionStart, selectionEnd);
        } else if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        }
    };

    var _setCaretToPos = function(input, pos) {
        _setSelectionRange(input, pos, pos);
    };

    // 阻止事件发生
    var preventDefault = function(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        // 支持IE
        else {
            e.returnValue = false;
        }
    };

    // 标注浏览器下获取光标位置
    // 1.勾选内容时返回[start,end]
    // 2.没有勾选内容时返回光标位置
    var getNormalCaret = function(el) {
        var start = el.selectionStart;
        var end = el.selectionEnd;

        // 没有勾选内容
        if (start === end) {
            return start;
        }

        // 勾选了内容
        return [start, end];
    };

    // 在IE下获取光标位置(不区分是否勾选)
    var getIECaret = function(el) {
        var start = 0;
        var range = el.createTextRange();
        var range2 = document.selection.createRange().duplicate();

        // get the opaque string
        var range2Bookmark = range2.getBookmark();

        // move the current range to the duplicate range
        range.moveToBookmark(range2Bookmark);

        var end = 0;

        // counts how many units moved (range calculated as before char and after char, loop count is the position)
        while (range.moveStart('character', -1) !== 0) {
            start++;
        }

        while (range.moveStart('character', 1) !== 0) {
            end++;
        }

        return start;
    };

    // 处理keydown
    var keyDownEventListener = function(e, curConfig, curEnableKeys) {
        console.log("keydown:" + e.which);
        var which = e.charCode ? e.charCode : e.keyCode;
        var target = e.target ? e.target : e.srcElement;

        // 更新最新的which
        lastKeyDownWhich = which;

        // 计算光标位置
        var position = target.selectionStart !== undefined ? getNormalCaret(target) : getIECaret(target);

        // 更新最新光标位置
        lastPosition = position;
        // 屏蔽shift、ctrl键
        if (e.shiftKey) {
            preventDefault(e);
        }
        // 开放ctrl+c、ctrl+v、ctrl+x
        if (e.ctrlKey) {
            if (which !== 67 && which !== 86 && which !== 88) {
                preventDefault(e);
            }
        }

        //是否能输入负数
        if (e.which == 229 || e.which == 189 || e.which == 109) {
            if (curConfig.negative == false) {
                preventDefault(e);
            }
        }

        //是否有小数
        if (e.which == 229 || e.which == 190 || e.which == 110) {
            if (curConfig.decimal == false) {
                preventDefault(e);
            }
        }

        //排除不符合条件的按钮
        if (curEnableKeys.indexOf(which) === -1 && which !== 13 && !e.ctrlKey) {
            preventDefault(e);
        }

        $(target).attr('ovalue', target.value);

    };

    // 处理keyup
    var keyUpEventListener = function(e, curConfig, hasEqual) {
        console.log("keyup");
        var which = e.charCode ? e.charCode : e.keyCode;
        var tg = e.target ? e.target : e.srcElement;

        var ovalue = $(tg).attr('ovalue');

        //除空格
        tg.value = tg.value.replace(/\s+/g, '');

        //是否有小数
        if (e.which == 190 || e.which == 110) {
            if (curConfig.decimal == false) {
                tg.value = tg.value.replace(/\./g, '');
                return;
            }

        }

        //是否能输入负数
        if (e.which == 189 || e.which == 109) {
            if (curConfig.negative == false) {
                tg.value = tg.value.replace(/\-/g, '');
                return;
            }
        }
        //去除非数字 . - 的字符
        tg.value = tg.value.replace(/[^0-9(\.)\-]/g, '');

        // eval("var re = /^(-)?(\\d)*(\\.)?(\\d*)$/;");

        var patt1 = /^(-)?(\d)*(\.)?(\d*)$/;

        var bool = patt1.test(tg.value);
        console.log("bool:::::::::::::::::"+bool);
        if (bool == false) {
            tg.value = ovalue;
            console.log("ovalue:::::::::::::::::"+ovalue);
        }

        var intNum;
        var decNum;
        if (curConfig.decimal == true) {
            var numarr = tg.value.split(".");
            console.log("numarr::::" + numarr);
            intNum = numarr[0];
            decNum = numarr[1];
        } else {
            intNum = tg.value;
        }

        var isnegative = /\-/.test(intNum);

        var intSize = isnegative == true ? curConfig.intSize + 1 : curConfig.intSize;


        intNum = intNum.substr(0, intSize);
        //console.log("intNum::::::::::::::::::::::::" + intNum);
        //console.log(decNum);

        var dian = /\./g.test(tg.value) ? "." : "";

        if (decNum != undefined) {
            decNum = decNum.substr(0, curConfig.decimalSize);
            tg.value = intNum + dian + decNum;
        } else {
            tg.value = intNum + dian;
        }

        if (which == 39 || which == 37 || which == 8) {
             // _setCaretToPos(tg, lastPosition - 1);
        }else{
           if (lastPosition[0] || lastPosition[0] == 0) {
                _setCaretToPos(tg, lastPosition[0] + 1);
            } else {
                _setCaretToPos(tg, lastPosition + 1);
            }
        }
    };

    // 不可拖入内容
    var dropEventListener = function(e) {
        preventDefault(e);
    };

    // dom与事件监听的映射关系
    var eventMap = [];

    // 处理单个dom
    var handlePerDom = function(dom, curConfig, curEnableKeys, hasEqual) {

        // 处理keyDown事件
        var keyDownEvent = (function(curConfig, curEnableKeys) {
            return function(e) {
                keyDownEventListener(e, curConfig, curEnableKeys);
            };
        })(curConfig, curEnableKeys);

        // 处理keyUp事件
        var keyUpEvent = (function(curConfig, curEnableKeys, hasEqual) {
            return function(e) {
                keyUpEventListener(e, curConfig, hasEqual);
            };
        })(curConfig, curEnableKeys, hasEqual);

        // 处理change事件
        var changeEvent = (function(curConfig, curEnableKeys, hasEqual) {
            return function(e) {
                keyUpEventListener(e, curConfig, hasEqual);
            };
        })(curConfig, curEnableKeys, hasEqual);

        if (dom.addEventListener) {
            dom.addEventListener("drop", dropEventListener, false);
            dom.addEventListener("keydown", keyDownEvent, false);
            dom.addEventListener("keyup", keyUpEvent, false);
            dom.addEventListener("change", changeEvent, false);
        }

        // 支持IE
        else {
            dom.attachEvent("ondrop", dropEventListener);
            dom.attachEvent("onkeydown", keyDownEvent);
            dom.attachEvent("onkeyup", keyUpEvent);
            dom.attachEvent("onchange", changeEvent);
        }

        // 保存dom与事件监听映射关系
        var domEvent = { dom: dom, keyDownEvent: keyDownEvent, keyUpEvent: keyUpEvent };
        eventMap.push(domEvent);
    };

    // 初始化配置信息
    var initConfig = function(config) {

        // 默认配置
        var defaultConfig = {

            // 是否可为负
            negative: true,

            // 是否可为小数
            decimal: true,

            // 整数位数
            intSize: 12,

            // 小数位数
            decimalSize: 4,

            //特殊输入法属性
            onumber: 0
        };

        // 组装自定义配置与当前默认配置
        if (config) {
            for (var attr in config) {
                if (config.hasOwnProperty(attr)) {
                    defaultConfig[attr] = config[attr];
                }
            }
        }

        return defaultConfig;
    };

    // 初始化可用键位
    var initEnableKeys = function(config) {

        // 可以输入的键：数字、退格、删除、左右、home、end
        var enableKeys = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 8, 46, 37, 39, 35, 36, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105];

        // 可为负数(189,firefox:173)
        if (config.negative) {

            // 大键盘的负号
            enableKeys.push(189);

            // 小键盘的负号
            enableKeys.push(109);

            enableKeys.push(173);
        }

        // 可为小数(190、110)
        if (config.decimal) {
            enableKeys.push(190);
            enableKeys.push(110);
        }

        return enableKeys;
    };

    // 解绑响应事件
    var clearPerDom = function(dom) {
        for (var i = 0; i < eventMap.length; i++) {
            if (dom === eventMap[i].dom) {
                if (dom.removeEventListener) {
                    dom.removeEventListener("drop", dropEventListener, false);
                    dom.removeEventListener("keydown", eventMap[i].keyDownEvent, false);
                    dom.removeEventListener("keyup", eventMap[i].keyUpEvent, false);
                }

                // 支持IE
                else {
                    dom.detachEvent("ondrop", dropEventListener);
                    dom.detachEvent("onkeydown", eventMap[i].keyDownEvent);
                    dom.detachEvent("onkeyup", eventMap[i].keyUpEvent);
                }
            }
        }

        // TODO 从集合中删除映射关系

    };

    var inputNumber = {

        // 初始化
        init: function(domObj, config, hasEqual) {

            // 初始化配置信息
            var curConfig = initConfig(config);

            // 初始化可用键位
            var curEnableKeys = initEnableKeys(curConfig);

            // 判断是否为jquery对象
            // jquery对象
            if (jQuery && domObj instanceof jQuery) {
                for (var i = 0; i < domObj.length; i++) {

                    // 禁用右键菜单
                    domObj.eq(i).bind("contextmenu", function(e) {
                        e.preventDefault();
                    });

                    handlePerDom(domObj.eq(i)[0], curConfig, curEnableKeys, hasEqual);
                }
            }

            // 原生dom
            else {
                // 判断dom是单个还是多个
                // 多个
                if (domObj.tagName === undefined) {
                    for (var i = 0; i < domObj.length; i++) {
                        handlePerDom(domObj[i], curConfig, curEnableKeys, hasEqual);
                    }
                } else {
                    handlePerDom(domObj, curConfig, curEnableKeys, hasEqual);
                }
            }
        },

        // 清理事件监听
        clear: function(domObj) {

            // jquery对象
            if (jQuery && domObj instanceof jQuery) {
                for (var i = 0; i < domObj.length; i++) {
                    clearPerDom(domObj.eq(i)[0]);
                }
            }

            // 原生
            else {
                // 判断dom是单个还是多个
                // 多个
                if (domObj.tagName === undefined) {
                    for (var i = 0; i < domObj.length; i++) {
                        clearPerDom(domObj[i]);
                    }
                } else {
                    clearPerDom(domObj);
                }
            }
        }
    };

    // 支持AMD
    if (typeof define === "function" && define.amd) {
        define(function() {
            return inputNumber;
        });
    } else {
        window.inputNumber = inputNumber;
    }
})();
