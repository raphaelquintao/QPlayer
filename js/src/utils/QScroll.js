define(function () {
    var QScroll = function (e, opt) {
        var _this = this;
        opt       = (opt !== undefined) ? opt : {};
        
        var classes = {
            outer:  'QScroll-outer',
            inner:  'QScroll-inner',
            holder: 'QScroll-holder',
            bar:    'QScroll-bar'
        };
        
        var options = {
            width:           (opt.width) ? opt.width : 3,
            autoHide:        (opt.autoHide === undefined) ? true : opt.autoHide,
            backgroundColor: (opt.backgroundColor) ? opt.backgroundColor : 'transparent',
            barColor:        (opt.barColor) ? opt.barColor : 'rgba(255,255,255,0.35)',
            contentClasses:  (opt.contentClasses) ? opt.contentClasses : ''
        };
        
        this.orgPar = (typeof e === 'string') ? document.querySelector(e) : e;
        this.sbw    = options.width;
        
        // this.parContent = this.orgPar.childNodes;
        // console.log(this.parContent);
        // this.orgPar.innerHTML = "";
        this.orgPar.style.overflowY = "hidden";
        
        // Outer div
        this.outer                 = document.createElement("div");
        this.outer.className       = classes.outer;
        this.outer.style.position  = "relative";
        this.outer.style.height    = "100%";
        this.outer.style.width     = "100%";
        this.outer.style.transform = "translate3D(0, 0, 0)";
        this.outer.style.overflow  = "hidden";
        this.outer.style.display   = "flex";
        
        // Inner div
        this.inner           = document.createElement("div");
        this.inner.className = classes.inner;
        this.inner.className += " " + options.contentClasses;
        
        this.inner.style.cssText = "overflow-y:scroll;overflow-x:hidden;";
        // this.inner.style.cssText = "overflow-y:auto;overflow-x:hidden;padding-right:0px;";
        // this.inner.style.cssText += "display:flex;flex-direction:row;flex-wrap:wrap; align-content:left;";
        // this.inner.style.cssText += "height:" + 200+ "px;";
        
        // Scroll Holder
        this.holder           = document.createElement("div");
        this.holder.className = classes.holder;
        
        // Scroll Bar
        this.bar           = document.createElement("div");
        this.bar.className = classes.bar;
        
        // Copy from original to inner div
        var num_items = _this.orgPar.children.length;
        for (var i = 0; i < num_items; i++) {
            this.inner.appendChild(_this.orgPar.children[0])
        }
        // this.inner.innerHTML  = _this.orgPar.innerHTML;
        this.orgPar.innerHTML = "";

        
        
        this.outer.appendChild(this.inner);
        this.holder.appendChild(this.bar);
        this.outer.appendChild(this.holder);
        this.orgPar.appendChild(this.outer);
        
        this.isM                     = (this.inner.offsetWidth - this.inner.clientWidth);
        this.isM                     = (this.isM === 0) ? 19 : this.isM+1;
        this.inner.style.marginRight = -this.isM + "px";
        this.inner.style.width       = 'calc(100% + ' + this.isM + 'px)';
        this.sbHeight                = this.orgPar.clientHeight * 100 / this.inner.scrollHeight;
        
        
        this.mdown    = false;
        this.onScroll = function (f) {
            _this.onScrollF = f
        };
        
        
        this.scrollBar = {
            scrollBar:       _this.bar,
            minWidth:        _this.sbw + "px",
            height:          _this.sbHeight + "%",
            position:        "absolute",
            right:           0,
            top:             0,
            backgroundColor: options.barColor,
            borderRadius:    "15px"
        };
        
        this.scrollBarHolder = {
            // scrollBarHolder: _this.holder,
            width:                 _this.sbw + "px",
            height:                "100%",
            position:              "absolute",
            right:                 0,
            top:                   0,
            backgroundColor:       options.backgroundColor,
            borderRadius:          "15px",
            transition:            'opacity .3s linear',
            opacity:               (options.autoHide) ? '0' : '1',
            marginRight:           "2px",
            'backface-visibility': 'hidden'
            // overflow:              'hidden'
        };
        
        for (_this.p in this.scrollBar) {
            this.bar.style[_this.p] = this.scrollBar[_this.p]
        }
        
        for (var p in this.scrollBarHolder) {
            _this.holder.style[p] = _this.scrollBarHolder[p];
        }
        
        
        this.inner.onscroll = function () {
            _this.holder.style.opacity = 1;
            
            _this.bar.style.top = _this.inner.scrollTop * 100 / _this.inner.scrollHeight + (_this.sbHeight - parseFloat(_this.scrollBar.height)) * _this.inner.scrollTop / (_this.inner.scrollHeight - _this.inner.clientHeight) + "%";
            _this.scrollBar.top = _this.bar.style.top;
            
            if ("onScrollF" in _this) {
                _this.onScrollF();
            }
            _this.refresh();
        };
        
        this.bar.onmousedown  = function (e) {
            _this.mdown         = true;
            _this.posCorrection = e.pageY - _this.bar.getBoundingClientRect().top;
            _this.btmCorrection = _this.bar.clientHeight * 100 / _this.outer.clientHeight;
            return false;
        };
        this.orgPar.onmouseup = function () {
            _this.mdown = false;
        };
        
        this.orgPar.onmousemove = function (e) {
            if (_this.mdown) {
                if (document.selection) {
                    document.selection.empty();
                }
                else {
                    window.getSelection().removeAllRanges();
                }
                _this.relY = e.pageY - _this.outer.getBoundingClientRect().top;
                _this.pC   = (_this.relY - _this.posCorrection) * 100 / _this.outer.clientHeight;
                if (_this.pC >= 0 && (_this.pC + _this.btmCorrection) <= 100) {
                    _this.bar.style.top   = _this.pC + "%";
                    _this.inner.scrollTop = (parseFloat(_this.bar.style.top) - (_this.sbHeight - parseFloat(_this.scrollBar.height)) * _this.inner.scrollTop / (_this.inner.scrollHeight - _this.inner.clientHeight)) * _this.inner.scrollHeight / 100;
                } else {
                    if (_this.pC < 0 && parseFloat(_this.bar.style.top) > 0) {
                        _this.bar.style.top   = "0%";
                        _this.inner.scrollTop = 0;
                    }
                }
                if ("onScrollF" in _this) {
                    _this.onScrollF();
                }
                _this.scrollBar.top = _this.bar.style.top;
            } else {
                return false;
            }
        };
        this.outer.onmouseenter = function (e) {
            // console.log('over');
            
            if (_this.inner.scrollHeight > _this.inner.clientHeight) _this.holder.style.opacity = 1;
        };
        this.outer.onmouseleave = function (e) {
            // console.log('leave');
            _this.holder.style.opacity = (options.autoHide) ? 0 : 1;
        };
        
        
        // window.addEventListener('resize', function (e) {
        //     console.log('resize');
        //     _this.sbHeight = _this.orgPar.clientHeight * 100 / _this.inner.scrollHeight;
        //     _this.scrollBar["height"] = parseFloat(_this.scrollBar["height"]) == _this.sbHeight ? _this.scrollBar["height"] : _this.sbHeight + "%";
        //     if (_this.inner.scrollHeight > _this.inner.clientHeight) {
        //         _this.bar.style.height = _this.scrollBar.height;
        //     }
        // }, false);
        
        // window.onresize = function (e) {
        //     console.log(resize);
        // };
        
        this.refresh = function () {
            _this.sbHeight            = _this.orgPar.clientHeight * 100 / _this.inner.scrollHeight;
            _this.scrollBar["height"] = parseFloat(_this.scrollBar["height"]) === _this.sbHeight ? _this.scrollBar["height"] : _this.sbHeight + "%";
            if (_this.inner.scrollHeight > _this.inner.clientHeight) {
                _this.bar.style.height = _this.scrollBar.height;
            }
            
            _this.isM                     = (_this.inner.offsetWidth - _this.inner.clientWidth)+1;
            _this.inner.style.marginRight = -_this.isM + "px";
            _this.inner.style.width       = 'calc(100% + ' + _this.isM + 'px)';
            
            _this.bar.style.top = _this.inner.scrollTop * 100 / _this.inner.scrollHeight + (_this.sbHeight - parseFloat(_this.scrollBar.height)) * _this.inner.scrollTop / (_this.inner.scrollHeight - _this.inner.clientHeight) + "%";
            _this.scrollBar.top = _this.bar.style.top;
            
        };
        
        
        this.setStyle = function (scrollBar, holder) {
            if (scrollBar !== undefined) {
                if ("height" in scrollBar) {
                    scrollBar["height"] = (parseFloat(scrollBar["height"]) * 100 / _this.outer.clientHeight) + "%";
                }
                for (_this.x in scrollBar) {
                    _this.scrollBar[_this.x] = scrollBar[_this.x];
                    _this.bar.style[_this.x] = scrollBar[_this.x];
                }
            }
            if (holder !== undefined) {
                for (_this.x in holder) {
                    _this.scrollBarHolder[_this.x] = holder[_this.x];
                    _this.holder.style[_this.x]    = holder[_this.x];
                }
            }
            return _this;
        };
        
        this.setClass = function (className) {
            _this.inner.classList.add(className);
            return _this;
        };
        
        // _this.refresh();
        
    };
    
    QScroll.VERSION = 0.27;
    
    return QScroll;
});

// define(function () {
//     return function (e, w) {
//         var _this = this;
//         this.orgPar = (typeof e === 'string') ? document.querySelector(e) : e;
//         this.sbw = (w == undefined) ? 6 : w;
//
//         // this.parContent = this.orgPar.childNodes;
//         // console.log(this.parContent);
//         // this.orgPar.innerHTML = "";
//         this.orgPar.style.overflowY = "hidden";
//         this.newPar = document.createElement("div");
//         this.sbContainer = document.createElement("div");
//         this.sbHolder = document.createElement("div");
//         this.sb = document.createElement("div");
//         this.inP = document.createElement("div");
//         this.newPar.className = "scrollbot-outer-parent";
//         this.sbHolder.className = "scrollbot-scrollbar-holder";
//         this.sb.className = "scrollbot-scrollbar";
//         this.inP.className = "scrollbot-inner-parent";
//         this.newPar.style.position = "relative";
//         // this.newPar.style.height = "100vh";
//         this.newPar.style.transform = "translate3D(0, 0, 0)";
//         this.newPar.style.overflow = "hidden";
//         this.newPar.style.display = "flex";
//         this.inP.style.cssText = "overflow-y:auto;overflow-x:hidden;padding-right:0px;";
//         // this.inP.style.cssText += "height:" + 200+ "px;";
//         for (var index = 0; index < this.orgPar.childNodes.length; index++) {
//             // console.log(this.orgPar.childNodes[index]);
//             this.inP.appendChild(this.orgPar.childNodes[index]);
//         }
//         this.orgPar.innerHTML = "";
//         // this.inP.style.height = this.orgPar.clientHeight + "px";
//         this.newPar.appendChild(this.inP);
//         this.sbHolder.appendChild(this.sb);
//         this.newPar.appendChild(this.sbHolder);
//         this.orgPar.appendChild(this.newPar);
//         this.isM = (this.inP.offsetWidth - this.inP.clientWidth);
//         this.isM = (this.isM == 0) ? 17 : this.isM;
//         this.inP.style.cssText += "margin-right:" + -this.isM + "px";
//         this.sbHeight = this.orgPar.clientHeight * 100 / this.inP.scrollHeight;
//         this.mdown = false;
//         this.onScroll = function (f) {_this.onScrollF = f};
//         this.scrollBar = {
//             scrollBar: _this.sb,
//             width: _this.sbw + "px",
//             height: _this.sbHeight + "%",
//             position: "absolute",
//             right: 0,
//             top: 0,
//             backgroundColor: "grey",
//             borderRadius: "15px"
//         };
//
//         this.scrollBarHolder = {
//             // scrollBarHolder: _this.sbHolder,
//             width: _this.sbw + "px",
//             height: "100%",
//             position: "absolute",
//             right: 0,
//             top: 0,
//             backgroundColor: "darkgrey",
//             borderRadius: "15px",
//             transition: 'opacity .3s linear',
//             opacity: '0',
//             marginRight: "3px",
//             'backface-visibility': 'hidden'
//         };
//
//         for (_this.p in this.scrollBar) {this.sb.style[_this.p] = this.scrollBar[_this.p]}
//
//         for (var p in this.scrollBarHolder) {_this.sbHolder.style[p] = _this.scrollBarHolder[p];}
//
//
//         this.inP.onscroll = function () {
//             _this.sb.style.top = _this.inP.scrollTop * 100 / _this.inP.scrollHeight + (_this.sbHeight - parseFloat(_this.scrollBar.height)) * _this.inP.scrollTop / (_this.inP.scrollHeight - _this.inP.clientHeight) + "%";
//             _this.scrollBar.top = _this.sb.style.top;
//             if ("onScrollF" in _this) {
//                 _this.onScrollF();
//             }
//             _this.refresh();
//         };
//
//         this.sb.onmousedown = function (e) {
//             _this.mdown = true;
//             _this.posCorrection = e.pageY - _this.sb.getBoundingClientRect().top;
//             _this.btmCorrection = _this.sb.clientHeight * 100 / _this.newPar.clientHeight;
//             return false;
//         };
//         this.orgPar.onmouseup = function () {_this.mdown = false;};
//
//         this.orgPar.onmousemove = function (e) {
//             if (_this.mdown) {
//                 if (document.selection) {document.selection.empty();}
//                 else {window.getSelection().removeAllRanges();}
//                 _this.relY = e.pageY - _this.newPar.getBoundingClientRect().top;
//                 _this.pC = (_this.relY - _this.posCorrection) * 100 / _this.newPar.clientHeight;
//                 if (_this.pC >= 0 && (_this.pC + _this.btmCorrection) <= 100) {
//                     _this.sb.style.top = _this.pC + "%";
//                     _this.inP.scrollTop = (parseFloat(_this.sb.style.top) - (_this.sbHeight - parseFloat(_this.scrollBar.height)) * _this.inP.scrollTop / (_this.inP.scrollHeight - _this.inP.clientHeight)) * _this.inP.scrollHeight / 100;
//                 } else {
//                     if (_this.pC < 0 && parseFloat(_this.sb.style.top) > 0) {
//                         _this.sb.style.top = "0%";
//                         _this.inP.scrollTop = 0;
//                     }
//                 }
//                 if ("onScrollF" in _this) {
//                     _this.onScrollF();
//                 }
//                 _this.scrollBar.top = _this.sb.style.top;
//             } else {
//                 return false;
//             }
//         };
//         this.newPar.onmouseenter = function (e) {
//             // console.log('over');
//             _this.sbHolder.style.opacity = 1;
//         };
//         this.newPar.onmouseleave = function (e) {
//             // console.log('leave');
//             _this.sbHolder.style.opacity = 0;
//         };
//
//         // window.addEventListener('resize', function (e) {
//         //     console.log('resize');
//         //     _this.sbHeight = _this.orgPar.clientHeight * 100 / _this.inP.scrollHeight;
//         //     _this.scrollBar["height"] = parseFloat(_this.scrollBar["height"]) == _this.sbHeight ? _this.scrollBar["height"] : _this.sbHeight + "%";
//         //     if (_this.inP.scrollHeight > _this.inP.clientHeight) {
//         //         _this.sb.style.height = _this.scrollBar.height;
//         //     }
//         // }, false);
//
//         // window.onresize = function (e) {
//         //     console.log(resize);
//         // };
//
//         this.refresh = function () {
//             // _this.inP.style.width = (_this.orgPar.clientWidth - _this.sbw) + "px";
//             // _this.inP.style.height = _this.orgPar.clientHeight + "px";
//             _this.sbHeight = _this.orgPar.clientHeight * 100 / _this.inP.scrollHeight;
//             _this.scrollBar["height"] = parseFloat(_this.scrollBar["height"]) == _this.sbHeight ? _this.scrollBar["height"] : _this.sbHeight + "%";
//             if (_this.inP.scrollHeight > _this.inP.clientHeight) {
//                 _this.sb.style.height = _this.scrollBar.height;
//             }
//
//             _this.isM = (_this.inP.offsetWidth - _this.inP.clientWidth);
//             _this.inP.style.cssText += "margin-right:" + -_this.isM + "px";
//
//         };
//         this.setStyle = function (sb, sbh) {
//             if (sb != undefined) {
//                 if ("height" in sb) {
//                     sb["height"] = (parseFloat(sb["height"]) * 100 / _this.newPar.clientHeight) + "%";
//                 }
//                 for (_this.x in sb) {
//                     _this.scrollBar[_this.x] = sb[_this.x];
//                     _this.sb.style[_this.x] = sb[_this.x];
//                 }
//             }
//             if (sbh != undefined) {
//                 for (_this.x in sbh) {
//                     _this.scrollBarHolder[_this.x] = sbh[_this.x];
//                     _this.sbHolder.style[_this.x] = sbh[_this.x];
//                 }
//             }
//             return _this;
//         }
//     };
//
// });