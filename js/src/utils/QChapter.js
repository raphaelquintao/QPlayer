define(['utils/QScroll'], function (QScroll) {
    
    /**
     * HTML5 video chapters for VTT
     * @param {HTMLVideoElement} videoDom
     * @constructor
     * @exports VideoChapters
     */
    var VideoChapters = function (videoDom) {
        var scope = this;
        var video = videoDom;
        var chapters = [];
        var activeIndex = 0;
        var activeText = '';
        var chaptersCount = 0;
        var container = null;
        
        var selectMenu = new Select();
        
        function Select() {
            var me = this;
            var css = "";
            
            var selected = 0;
            var timeout;
            
            // var style = document.createElement('style');
            // style.innerText = css;
            
            this.selectDom = document.createElement('div');
            this.selectDom.classList.add('qc-select');
            this.selectDom.style.display = 'none';
            
            this.header = document.createElement('div');
            this.header.classList.add('qc-list-header');
            
            this.list = document.createElement('ul');
            this.list.classList.add('qc-list');
            
            // this.selectDom.appendChild(style);
            this.selectDom.appendChild(this.header);
            this.selectDom.appendChild(this.list);


            var scroll = null;
            
            this.updateList = function () {
                if (chapters.length <= 0) return;
                this.header.innerText = chapters[activeIndex].label;
                for (var cc = 0; cc < chapters[activeIndex].texts.length; cc++) {
                    var chapter = chapters[activeIndex].texts;
                    var item = document.createElement('li');
                    item.classList.add('item');
                    item.setAttribute('data-index', cc);
                    item.setAttribute('data-selected', false);
                    item.addEventListener('click', function () {
                        var nindex = this.getAttribute('data-index');
                        me.updateSelected(parseInt(nindex));
                        video.currentTime = chapters[activeIndex].texts[nindex].startTime;
                        me.setVisible(false);
                    });
                    
                    var index = document.createElement('span');
                    index.innerText = cc + 1;
                    
                    var label = document.createElement('span');
                    label.innerText = chapter[cc].text;
                    
                    item.appendChild(index);
                    item.appendChild(label);
                    this.list.appendChild(item);
                    // if(cc === 1) {
                    //     console.log("Index", cc, chapter[cc].text);
                    // }
                }
                
                if (scroll === null)
                    scroll = new QScroll(this.list).setStyle({}, {
                        backgroundColor: 'transparent'
                    });
                
            };
            
            this.updateSelected = function (currCount) {
                var childs = this.list.children;
                var old = this.list.querySelector("[data-selected=true]");
                var nww = this.list.querySelector("[data-index='" + currCount + "']");
                if (old) old.setAttribute('data-selected', false);
                if (nww) nww.setAttribute('data-selected', true);
                
                // if (selected != currCount && childs.length > 0) {
                //     if (childs[selected]) childs[selected].setAttribute('data-selected', false);
                //     if (childs[currCount]) childs[currCount].setAttribute('data-selected', true);
                //     selected = currCount;
                // }
            };
            
            this.isVisible = function () {
                return (this.selectDom.style.display !== 'none');
            };
            
            this.setVisible = function (visible) {
                if (visible) {
                    this.selectDom.style.display = '';
                    setTimeout(function () {
                        me.selectDom.style.opacity = '1';
                    }, 300);
                } else {
                    this.selectDom.style.opacity = '0';
                    setTimeout(function () {
                        me.selectDom.style.display = 'none';
                    }, 300);
                }
            };
            
            this.selectDom.addEventListener('mouseleave', function () {
                me.setVisible(false);
            }, false);
            
        }
        
        this.showMenu = function (holder, visible, centerX, centerY) {
            if (container == null) {
                container = holder;
                container.appendChild(selectMenu.selectDom);
            }
            if (centerX && centerY) {
                selectMenu.selectDom.style.left = centerX + 'px';
                selectMenu.selectDom.style.top = centerY + 'px';
                selectMenu.selectDom.style.maxHeight = centerY + 'px';
            }
            selectMenu.setVisible(visible);
        };
        
        
        this.onChange = function (text) {
            
        };
        
        this.getLabelBySeconds = function (seconds) {
            var text = "";
            var count = 0;
            if (chapters[activeIndex] && chapters[activeIndex].texts.length > 0) {
                while (chapters[activeIndex].texts[count].endTime < seconds) {
                    count++;
                    if (count == chapters[activeIndex].texts.length - 1) break;
                }
                if (seconds > chapters[activeIndex].texts[count].startTime &&
                    seconds < chapters[activeIndex].texts[count].endTime) {
                    text += chapters[activeIndex].texts[count].text;
                }
            }
            return text;
        };
        
        function getMetadata() {
            var temp = video.getElementsByTagName('track');
            var count = 0;
            for (var c = 0; c < temp.length; c++) {
                var kind = temp[c].getAttribute('kind');
                if (kind == 'chapters') {
                    count++;
                    var current = {
                        src:      temp[c].getAttribute('src'),
                        kind:     kind,
                        language: temp[c].getAttribute('srclang'),
                        label:    temp[c].getAttribute('label'),
                        default:  (temp[c].getAttribute('default') !== null),
                    };
                    current.index = count;
                    current.texts = [];
                    if (!activeIndex && current.default) activeIndex = current.index;
                    chapters[count] = current;
                }
            }
            
            if (activeIndex) setChapter(activeIndex);
        }
        
        function setChapter(index) {
            activeIndex = index;
            
            if (chapters[activeIndex].texts.length <= 0) {
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        parseData(this.responseText);
                    }
                };
                xhttp.open("GET", chapters[activeIndex].src, true);
                xhttp.send();
            } else {
                updateEvents();
            }
        }
        
        function parseData(response) {
            index = activeIndex;
            
            var ext = (chapters[index].src).split('.');
            
            var isSRT = !(ext[ext.length - 1].toLowerCase() === 'vtt');
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
                
                chapters[index].texts.push({
                    startTime: start,
                    endTime:   end,
                    text:      match[9]
                });
            }
            
            updateEvents();
            // console.log("Chapters Length", records.length, records);
        }
        
        function updateEvents() {
            chaptersCount = 0;
            video.removeEventListener('seeked', eventSeek);
            video.removeEventListener('timeupdate', eventTime);
            
            video.addEventListener('seeked', eventSeek);
            video.addEventListener('timeupdate', eventTime);
            
            eventSeek();
            eventTime();
            
            selectMenu.updateList();
        }
        
        function eventSeek(e) {
            if (chapters[activeIndex].texts.length <= 0) return;
            chaptersCount = 0;
            while (chapters[activeIndex].texts[chaptersCount].endTime <= video.currentTime) {
                chaptersCount++;
                if (chaptersCount == chapters[activeIndex].texts.length - 1) break;
            }
            selectMenu.updateSelected(chaptersCount);
        }
        
        function eventTime(e) {
            var text = "";
            if (chapters[activeIndex].texts.length > 0) {
                if (video.currentTime >= chapters[activeIndex].texts[chaptersCount].startTime &&
                    video.currentTime < chapters[activeIndex].texts[chaptersCount].endTime) {
                    text += chapters[activeIndex].texts[chaptersCount].text;
                }
                if (video.currentTime > chapters[activeIndex].texts[chaptersCount].endTime &&
                    chaptersCount < (chapters[activeIndex].texts.length - 1))
                    chaptersCount++;
            }
            if (text != activeText) {
                scope.onChange(text);
                activeText = text;
                selectMenu.updateSelected(chaptersCount);
            }
            
        }
        
        
        
        getMetadata();
        
    };
    
    return VideoChapters;
});