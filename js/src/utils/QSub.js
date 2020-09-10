/**
 * Copyright 2017 - Raphael Quintao - quintao.ninja
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 */

define(['libs/EventDispatcher', 'libs/encoding'], function (EventDispatcher, Encoding) {
    
    
    function QSubCue(startTime, endTime, text, id) {
        this.startTime = startTime;
        this.endTime   = endTime;
        this.text      = text;
        this.track     = null;
        
        var _id = "";
        
        Object.defineProperty(this, "id", {
            get: function () { return _id; },
            set: function (value) { _id = "" + value; }
        });
        
        if (id !== undefined) this.id = id;
        
    }
    
    
    function QSubTrack(options) {
        if(options === undefined) options = {};
        this.src      = options.src;
        this.kind     = options.kind || 'subtitles'; // subtitles or captions
        this.language = options.language;
        this.label    = options.label || options.language;
        this.default  = options.default || false;
        this.enabled  = options.enabled || false;
        this.id       = "";
        this.loaded   = false;
        this.cues     = [];
        this.encoding = '';
        
        Object.defineProperties(this, {
            'oncuechange':    {
                enumerable: false,
                writable:   true,
                value:      null
            },
            'onloadingstart': {
                enumerable: false,
                writable:   true,
                value:      null
            },
            'onloadingend':   {
                enumerable: false,
                writable:   true,
                value:      null
            },
            'onloadingfail':  {
                enumerable: false,
                writable:   true,
                value:      null
            },
        });
    }
    
    QSubTrack.prototype.addCue = function (cue) {
        cue.track = this;
        this.cues.push(cue);
    };
    
    QSubTrack.prototype.loadTrack = function (onLoad, onError) {
        var self = this;
        
        if (typeof onLoad === 'function') this.onloadingend = onLoad;
        if (typeof onError === 'function') this.onloadingend = onError;
        
        if (!this.loaded) {
            if (self.onloadingstart) self.onloadingstart();
            
            var req = new XMLHttpRequest();
            req.open("GET", this.src, true);
            
            req.onload = function (event) {
                var buffer = req.response;
                if (buffer) {
                    var detect    = Encoding.detect(buffer);
                    self.encoding = detect;
                    
                    var utf8 = Encoding.convert(buffer, {
                        to:   'unicode',
                        from: detect,
                        type: 'string'
                    });
                    
                    self.parseData(utf8);
                    
                    // if (self.menuItem) {
                    //     self.menuItem.innerText = self.label + ' - ' + self.encoding;
                    // }
                    
                }
            };
            
            // req.onreadystatechange = function () {
            //     if (this.readyState == 4 && this.status == 200) {
            //         self.parseData(this.responseText);
            //     }
            // };
            
            req.send();
            
        } else {
            if (this.onloadingend) this.onloadingend(this);
        }
        
    };
    
    
    QSubTrack.prototype.parseData = function (response) {
        var ext = (this.src).split('.');
        
        var isSRT  = !(ext[ext.length - 1].toLowerCase() === 'vtt');
        var offset = (isSRT) ? 0 : 1;
        
        var records = response.replace(/(\r\n|\r|\n)/g, '\n').split('\n\n');
        for (var c = offset; c < records.length; c++) {
            var regex = /(?:[0-9]+\n)?(?:([0-9]{2}):)?([0-9]{2}):([0-9]{2})[.,]([0-9]{3}) --> (?:([0-9]{2}):)?([0-9]{2}):([0-9]{2})[.,]([0-9]{3})(?:.*\n)((?:.+\n?)+)/g;
            var match = regex.exec(records[c]);
            
            if (!match) continue;
            var start = Math.floor(match[2] * 60) + parseFloat(match[3] + '.' + match[4]);
            if (match[1]) start += Math.floor(match[1] * 60 * 60);
            
            var end = Math.floor(match[6] * 60) + parseFloat(match[7] + '.' + match[8]);
            if (match[5]) end += Math.floor(match[5] * 60 * 60);
            
            
            this.addCue(new QSubCue(start, end, match[9]));
        }
        
        this.loaded = true;
        if (this.onloadingend) this.onloadingend(this);
    };
    
    
    
    /*
     * MENU
     */
    function QSubMenu(textHeader) {
        var classes = {
            root:              'qs-select',
            listContainer:     'qs-list-container',
            listHeader:        'qs-list-header',
            list:              'qs-list',
            listItem:          'qs-item',
            listItemLabel:     'qs-label',
            listItemInfo:      'qs-info',
            btnCurrent:        'qs-current',
            btnCurrentLoading: 'loading'
            
        };
        
        var select = document.createElement('div');
        select.classList.add(classes.root);
        
        var container = document.createElement('div');
        container.classList.add(classes.listContainer);
        
        var header = document.createElement('div');
        header.classList.add(classes.listHeader);
        header.innerText = textHeader;
        
        var list = document.createElement('div');
        list.classList.add(classes.list);
        
        var current = document.createElement('div');
        current.classList.add(classes.btnCurrent);
        current.innerText = textHeader;
        
        container.appendChild(header);
        container.appendChild(list);
        
        select.appendChild(container);
        select.appendChild(current);
        
        
        this.classes = classes;
        this.root    = select;
        this.select  = select;
        this.current = current;
        this.list    = list;
        
        return this;
    }
    
    QSubMenu.prototype.createStyle = function () {
        //<editor-fold desc="CSS">
        var css = "";
        //</editor-fold>
        
        // var style = document.createElement('style');
        
        // style.innerText = css;
        // this.select.appendChild(style);
        
        return this;
    };
    
    
    QSubMenu.prototype.createItem = function (data) {
        var listItem = document.createElement('div');
        listItem.classList.add(this.classes.listItem);
        
        var listItemLabel = document.createElement('div');
        listItemLabel.classList.add(this.classes.listItemLabel);
        
        var listItemInfo = document.createElement('div');
        listItemInfo.classList.add(this.classes.listItemInfo);
        
        listItem.appendChild(listItemLabel);
        listItem.appendChild(listItemInfo);
        
        listItem._el       = {};
        listItem._el.label = listItemLabel;
        listItem._el.info  = listItemInfo;
        
        var _data = listItem._data = Object.assign({
            textInfo: '',
            attr:     []
        }, data);
        
        var self = this;
        Object.defineProperty(_data.attr, 'selected', {
            get: function () {
                return _data.attr;
            },
            set: function (value) {
                if (value === true) {
                    var curr = self.list.querySelector('[data-selected="true"]');
                    if (curr) curr.setAttribute('data-selected', false);
                    self.current.innerText = listItemLabel.innerText;
                }
                listItem.setAttribute('data-selected', value);
                
            }
        });
        
        // console.log(_data);
        
        data._el          = {};
        data._el.listItem = listItem;
        data._el.label    = listItemLabel;
        data._el.info     = listItemInfo;
        
        
        Object.defineProperties(data, {
            'textLabel': {
                get: function () {
                    return _data.textLabel;
                },
                set: function (value) {
                    listItemLabel.innerText  = value;
                    listItem._data.textLabel = value;
                }
                
            },
            'textInfo':  {
                get: function () {
                    return _data.textInfo;
                },
                set: function (value) {
                    listItemInfo.innerText  = value;
                    listItem._data.textInfo = value;
                }
            },
            'attr':      {
                get: function () {
                    return _data.attr;
                },
                set: function (value) {
                    _data.attr = value;
                }
            }
        });
        
        listItem.addEventListener('click', function (e) {
            // console.log("\nINTERNAL");
            return data.click(e);
            // console.log(data);
        });
        
        data.textLabel = _data.textLabel;
        data.textInfo  = _data.textInfo;
        
        this.list.appendChild(listItem);
        return data;
    };
    
    QSubMenu.prototype.loading = function (show) {
        if (show) this.current.classList.add(this.classes.btnCurrentLoading);
        else this.current.classList.remove(this.classes.btnCurrentLoading);
    };
    
    function QSub(videoDom) {
        var self  = this;
        var video = videoDom;
        
        var menu = new QSubMenu('Subtitles');
        // menu.root.classList.add('qs-show');

        
        var btnDisable              = menu.createItem({
            textLabel: 'OFF',
            click:     function () {
                this.attr['selected'] = true;
                setTrack(new QSubTrack());
            }
        });
        btnDisable.attr['selected'] = true;
        
        
        var tracks      = [];
        tracks.addTrack = function (track) {
            track.id             = this.length;
            track.onloadingstart = this.onloadingstart;
            track.cuechange      = this.cuechange;
            
            this.push(track);
            return track;
        };
        
        tracks.onloadingstart = function () {
            menu.loading(true);
        };
        
        tracks.oncuechange = function (cue) {
            // console.log('CUE CHANGE', cue);
        };
        
        
        
        // var teste = menu.createItem({
        //     textLabel: 'Load Test',
        //     click:     function () {
        //         var t      = tracks.addTrack(new QSubTrack({
        //             src:      'media/pt-br.srt',
        //             kind:     'subtitles',
        //             language: 'pt',
        //             label:    'Teste'
        //         }));
        //         t.menuItem = menu.createItem({
        //             textLabel: t.label,
        //             textInfo:  t.encoding,
        //             track:     t,
        //             click:     function () {
        //                 this.track.loadTrack(function (track) {
        //                     menu.loading(false);
        //                     track.menuItem.textInfo = track.encoding;
        //                     setTrack(track);
        //                 });
        //                 this.attr['selected'] = true;
        //             },
        //         });
        //
        //     }
        // });


        var empty = new QSubCue(0, 0, '');
        
        var active = {
            syncing: false,
            count:   0,
            track:   null,
            cue:     null
        };
        
        function setTrack(track) {
            active.track = track;
            active.count = 0;
            
            // console.log('Loading END', active.track);
            
            syncTrack();
        }
        
        function syncTrack() {
            active.syncing = true;
            
            active.count = 0;
            
            if (!active.track) return;
            
            var cues = active.track.cues;
            if (!cues || cues.length <= 0) {
                active.syncing = false;
                return;
            }
            
            while (cues[active.count].endTime < video.currentTime) {
                active.count++;
                if (active.count === cues.length - 1) break;
            }
            
            active.syncing = false;
            eventTime();
        }
        
        
        
        
        var temp = video.getElementsByTagName('track');
        for (var c = 0; c < temp.length; c++) {
            var kind = temp[c].getAttribute('kind');
            if (kind === 'subtitles' || kind === 'captions') {
                var t = new QSubTrack({
                    src:      temp[c].getAttribute('src'),
                    kind:     temp[c].getAttribute('kind'),
                    language: temp[c].getAttribute('srclang'),
                    label:    temp[c].getAttribute('label'),
                    default:  (temp[c].getAttribute('default') !== null),
                });
                tracks.addTrack(t);
                // if (t.default) t.loadTrack();
            }
        }
        
        tracks.sort(function (a, b) {
            return a.label > b.label;
        });
        
        
        
        for (var i = 0; i < tracks.length; i++) {
            // menu.createMenuItem(tracks[i]);
            tracks[i].menuItem = menu.createItem({
                textLabel: tracks[i].label,
                textInfo:  tracks[i].encoding,
                track:     tracks[i],
                click:     function () {
                    this.track.loadTrack(function (track) {
                        menu.loading(false);
                        track.menuItem.textInfo = track.encoding;
                        setTrack(track);
                    });
                    this.attr['selected'] = true;
                },
            });
            if (tracks[i].default) tracks[i].menuItem.click();
        }
        
        
        function eventSeek(e) {
            syncTrack();
        }
        
        function eventTime(e) {
            if (!active.track || active.syncing) return;
            
            var cues = active.track.cues;
            
            var a = empty;
            
            if (cues.length > 0) {
                if (video.currentTime > cues[active.count].startTime && video.currentTime < cues[active.count].endTime)
                    a = cues[active.count];
                if (video.currentTime > cues[active.count].endTime && active.count < (cues.length - 1))
                    active.count++;
            }
            
            if (a !== active.cue) {
                self.oncuechange(a);
                active.cue = a;
            }
        }
        
        
        video.addEventListener('seeked', eventSeek);
        video.addEventListener('timeupdate', eventTime);
        
        
        
        
        var count  = 0;
        var debug1 = document.getElementById('debug1');
        
        // this.oncuechange = function (cue) {
        //     console.log('OLD CUE CHANGE', cue);
        //     debug1.innerText = "Count: " + (count++) + "\n";
        //     debug1.innerText += JSON.stringify(cue.text, null, 2);
        // };
        
        this.tracks    = tracks;
        this.domSelect = menu.select;
        
        this.appendMenuTo = function (element) {
            element.appendChild(this.domSelect);
            return this;
        };
        
        return this;
    }
    
    // Object.assign(QSub.prototype, EventDispatcher.prototype);
    
    
    
    // function SRT(videoDom) {
    //     var scope  = this;
    //     var video  = videoDom;
    //     var tracks = [];
    //     tracks.push({
    //         src:      null,
    //         kind:     "subtitles",
    //         language: 'disabled',
    //         label:    'Disabled',
    //         index:    0,
    //         cues:     []
    //     });
    //
    //     var d_index    = null;
    //     var t_index    = 0;
    //     var cuescount  = 0;
    //     var activeText = "";
    //
    //     this.domSelect = document.createElement('div');
    //     var enabled    = true;
    //
    //     Object.defineProperty(this, 'enabled', {
    //         get: function () {
    //             return enabled;
    //         },
    //         set: function (value) {
    //             enabled = value;
    //             if (!enabled) {
    //                 scope.domSelect.style = 'display: none;';
    //                 updateEvents(true);
    //                 scope.onChange("");
    //             } else {
    //                 scope.domSelect.style = '';
    //                 updateEvents();
    //             }
    //         }
    //     });
    //
    //     this.onChange = function (text) {
    //     };
    //
    //     function createSelect() {
    //         var css = `
    // 	.qs-select {
    // 	  color: #ffffff;
    // 	  font-size: 13px;
    // 	  text-shadow: 0px 0px 3px rgba(0, 0, 0, 1);
    // 	  font-family: Roboto, Arial, sans-serif;
    // 	  font-weight: 300;
    // 	  position: absolute;
    // 	  bottom: 0;
    // 	  right: 0;
    // 	  margin: 10px;
    // 	  overflow: hidden;
    // 	  display: flex;
    // 	  flex-direction: column-reverse;
    // 	  align-items: flex-end;
    // 	}
    // 	.qs-current {
    // 	  cursor: pointer;
    // 	  line-height: 1;
    // 	  padding: 0 5px;
    // 	  opacity: 0.4;
    // 	  transition: opacity .3s;
    // 	}
    // 	.qs-current.loading {
    // 	  opacity: 1;
    // 	  animation: blinker 1s linear infinite;
    // 	}
    //
    // 	@keyframes blinker {
    // 	  50% { opacity: 0.3; }
    // 	}
    // 	.qs-select:hover .qs-current {
    // 	  opacity: 1;
    // 	}
    // 	.qs-list {
    // 	  background: rgba(28, 28, 28, 0.9);
    // 	  color: #eee;
    // 	  font-size: 11px;
    // 	  text-shadow: 0 0 2px rgba(0, 0, 0, .5);
    // 	  box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.3);
    // 	  padding: 3px 0;
    // 	  margin: 0;
    // 	  border-radius: 3px;
    // 	  transition-timing-function: ease-in-out;
    // 	  transition: opacity 0.9s, width 0s 1s, height 0s 1s, margin 0s 1s;
    // 	  opacity: 0;
    // 	  width: 0;
    // 	  height: 0;
    // 	}
    // 	.qs-select:hover > .qs-list {
    // 	  transition: opacity 0.9s, width 0s, height 0s;
    // 	  width: 100%;
    // 	  height: 100%;
    // 	  opacity: 1;
    // 	  margin-bottom: 10px
    // 	}
    // 	.qs-list .qs-label {
    // 	  padding: 0px 20px 0 35px;
    // 	  font-size: 118%;
    // 	  line-height: 33px;
    // 	  cursor: pointer;
    // 	}
    // 	.qs-label[data-selected~=true] {
    // 	  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMTAwJSIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIxMDAlIj48cGF0aCBkPSJNOSAxNi4yTDQuOCAxMmwtMS40IDEuNEw5IDE5IDIxIDdsLTEuNC0xLjRMOSAxNi4yeiIgZmlsbD0iI2ZmZiIgLz48L3N2Zz4=);
    // 	  background-repeat: no-repeat;
    // 	  background-position: left 10px center;
    // 	  background-size: 18px 18px;
    // 	}
    // 	.qs-list .qs-label:hover {
    // 	  background-color: rgba(255, 255, 255, .1);
    // 	}
    // 	`;
    //
    //         var style       = document.createElement('style');
    //         style.innerText = css;
    //
    //         var select = scope.domSelect;
    //         select.classList.add('qs-select');
    //
    //         var current = document.createElement('span');
    //         current.classList.add('qs-current');
    //         current.innerText = tracks.find(function (meta) {
    //             return meta.index == t_index;
    //         }).label;
    //
    //
    //         var list = document.createElement('div');
    //         list.classList.add('qs-list');
    //
    //         for (var c = 0; c < tracks.length; c++) {
    //             var label = document.createElement('div');
    //             label.classList.add('qs-label');
    //             label.innerText = tracks[c].label;
    //             label.setAttribute('data-index', tracks[c].index);
    //             label.setAttribute('data-selected', (tracks[c].index == t_index));
    //             label.addEventListener('click', function () {
    //                 var nindex = this.getAttribute('data-index');
    //                 // var current = list.querySelector(".example");
    //                 // var current = list.querySelector(".example");
    //                 current.innerText = tracks.find(function (meta) {
    //                     return meta.index == nindex;
    //                 }).label;
    //                 list.querySelector("[data-selected=true]").setAttribute('data-selected', "false");
    //                 this.setAttribute('data-selected', "true");
    //                 current.classList.add('loading');
    //                 setSub(nindex, function () {
    //                     current.classList.remove('loading');
    //                 });
    //             });
    //             list.appendChild(label);
    //         }
    //         select.appendChild(style);
    //         select.appendChild(current);
    //         select.appendChild(list);
    //
    //     }
    //
    //     function getMetadata() {
    //         var temp = video.getElementsByTagName('track');
    //         for (var c = 0; c < temp.length; c++) {
    //             var kind = temp[c].getAttribute('kind');
    //             if (kind == 'subtitles') {
    //                 var t   = {
    //                     src:      temp[c].getAttribute('src'),
    //                     kind:     "subtitles",
    //                     language: temp[c].getAttribute('srclang'),
    //                     label:    temp[c].getAttribute('label'),
    //                     default:  (temp[c].getAttribute('default') !== null),
    //                 };
    //                 t.index = c + 1;
    //                 t.cues  = [];
    //                 if (!d_index && t.default) d_index = t;
    //                 tracks.push(t);
    //             }
    //         }
    //
    //         tracks.sort(function (a, b) {
    //             if (a.index == 0) return -1;
    //             if (b.index == 0) return 1;
    //
    //             return a.label > b.label;
    //         });
    //         // console.log(tracks);
    //
    //         if (d_index) setSub(d_index.index);
    //     }
    //
    //     function setSub(index, callback = null) {
    //         t_index = index;
    //
    //         if (t_index == 0) {
    //             updateEvents(true);
    //             if (callback) callback();
    //         } else {
    //             if (tracks.find(function (meta) {
    //                     return meta.index == index;
    //                 }).cues.length <= 0) {
    //                 var xhttp                = new XMLHttpRequest();
    //                 xhttp.onreadystatechange = function () {
    //                     if (this.readyState == 4 && this.status == 200) {
    //                         parseData(this.responseText, index);
    //                         if (callback) callback();
    //                     }
    //                 };
    //                 xhttp.open("GET", tracks.find(function (meta) {
    //                     return meta.index == index;
    //                 }).src, true);
    //                 xhttp.send();
    //             } else {
    //                 updateEvents();
    //                 if (callback) callback();
    //             }
    //         }
    //     }
    //
    //     function updateEvents(justRemove = false) {
    //         cuescount = 0;
    //         video.removeEventListener('seeked', eventSeek);
    //         video.removeEventListener('timeupdate', eventTime);
    //
    //         if (!justRemove) {
    //             video.addEventListener('seeked', eventSeek);
    //             video.addEventListener('timeupdate', eventTime);
    //         }
    //         eventSeek();
    //         eventTime();
    //     }
    //
    //     function eventSeek(e) {
    //         cuescount = 0;
    //         var track = tracks.find(function (meta) {
    //             return meta.index == t_index;
    //         });
    //
    //         if (track.cues.length > 0)
    //             while (track.cues[cuescount].endTime < video.currentTime) {
    //                 cuescount++;
    //                 if (cuescount == track.cues.length - 1) break;
    //             }
    //     }
    //
    //
    //     function eventTime(e) {
    //         var track = tracks.find(function (meta) {
    //             return meta.index == t_index;
    //         });
    //
    //         var text = "";
    //         if (track.cues.length > 0) {
    //             if (video.currentTime > track.cues[cuescount].startTime &&
    //                 video.currentTime < track.cues[cuescount].endTime) {
    //                 text += track.cues[cuescount].text;
    //             }
    //             if (video.currentTime > track.cues[cuescount].endTime &&
    //                 cuescount < (track.cues.length - 1))
    //                 cuescount++;
    //         }
    //         if (text != activeText) {
    //             scope.onChange(text);
    //             activeText = text;
    //         }
    //     }
    //
    //
    //     function parseData(response, index) {
    //         var track = tracks.find(function (meta) {
    //             return meta.index == index;
    //         });
    //
    //         var ext = (track.src).split('.');
    //
    //         var isSRT  = !(ext[ext.length - 1].toLowerCase() === 'vtt');
    //         var offset = (isSRT) ? 0 : 1;
    //
    //         var records = response.replace(/(\r\n|\r|\n)/g, '\n').split('\n\n');
    //         for (var c = offset; c < records.length; c++) {
    //             var regex = /(?:[0-9]+\n)?(?:([0-9]{2}):)?([0-9]{2}):([0-9]{2})[.,]([0-9]{3}) --> (?:([0-9]{2}):)?([0-9]{2}):([0-9]{2})[.,]([0-9]{3})(?:.*\n)((?:.+\n?)+)/g;
    //             var match = regex.exec(records[c]);
    //
    //             if (!match) continue;
    //             var start = Math.floor(match[2] * 60) + parseFloat(match[3] + '.' + match[4]);
    //             if (match[1]) start += Math.floor(match[1] * 60 * 60);
    //
    //             var end = Math.floor(match[6] * 60) + parseFloat(match[7] + '.' + match[8]);
    //             if (match[5]) end += Math.floor(match[5] * 60 * 60);
    //
    //             track.cues.push({
    //                 startTime: start,
    //                 endTime:   end,
    //                 text:      match[9]
    //             });
    //         }
    //
    //         updateEvents();
    //     }
    //
    //
    //
    //
    //     getMetadata();
    //     createSelect();
    //
    //     this.appendMenuTo = function (element) {
    //         element.appendChild(this.domSelect);
    //         return this;
    //     };
    //
    //     return this;
    // }
    
    
    return QSub;
    
});