const getJsonUpload = () =>
    new Promise(resolve => {
        const inputFileElement = document.createElement('input')
        inputFileElement.setAttribute('type', 'file')
        // inputFileElement.setAttribute('multiple', 'false')
        inputFileElement.setAttribute('accept', '.json')

        inputFileElement.addEventListener(
            'change',
            async (event) => {
                const { files } = event.target
                if (!files) {
                    return
                }

                const filePromises = [...files].map(file => file.text())

                resolve(await Promise.all(filePromises))
            },
            false,
        )
        inputFileElement.click()
    });
class PathGenerator {
    currentPath;
    isRelative;
    clear() {
        this.currentPath = '';
        return this;
    }
    moveTo() {
        this._appendData('M', arguments);
        return this;
    };
    close() {
        this.closePath();
    }
    closePath() {
        this._appendData('Z', []);
        return this;
    };
    lineTo = function () {
        this._appendData('L', arguments);
        return this;
    };
    horizontalLineTo = function (x) {
        this._appendData('H', [x]);
        return this;
    };
    verticalLineTo = function (y) {
        this._appendData('V', [y]);
        return this;
    };
    curveTo = function () {
        this._appendData('C', arguments);
        return this;
    };
    smoothCurveTo() {
        this._appendData('S', arguments);
        return this;
    };
    bezierCurveTo() {
        this._appendData('Q', arguments);
        return this;
    };
    smoothBezierCurveTo() {
        this._appendData('T', arguments);
        return this;
    };
    ellipticalArc() {
        this._appendData('A', arguments);
        return this;
    };
    relative() {
        this.isRelative = true;
        return this;
    }
    end() {
        return this.currentPath;
    }
    _appendData(symbol, args) {

        args = Array.prototype.slice.call(args);

        if (this.isRelative) {
            symbol = symbol.toLowerCase();
            this.isRelative = false;
        }

        this.currentPath += symbol + ' ' + args.join(' ') + ' ';
    };
}
class LineItem {
    NodeFrom;
    NodeTo;
    parent;
    elLine;
    pathGenerator;
    constructor({ NodeFrom, NodeTo }, parent) {
        this.NodeFrom = NodeFrom;
        this.NodeTo = NodeTo;
        this.parent = parent;
        this.elLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.elLine.setAttribute('stroke', "red");
        this.elLine.setAttribute('stroke-width', 2);
        this.elLine.setAttribute('fill', "transparent");
        var self = this;
        /* 
        this.elLine.addEventListener('dblclick', function () {
             self.Remove();
         })*/
        this.elLine.addEventListener('mouseover', function () {
            self.elLine.setAttribute('stroke-width', 5);
        })
        this.elLine.addEventListener('mouseleave', function () {
            self.elLine.setAttribute('stroke-width', 2);
        })
        this.parent.elCanvas.appendChild(this.elLine);
        this.NodeFrom.Lines.push(this);
        this.NodeTo.Lines.push(this);
        this.pathGenerator = new PathGenerator();
        this.UpdatePostion();
    }
    UpdatePostion() {
        var x1 = this.NodeFrom.data.x + (this.NodeFrom.data.width / 2);
        var y1 = this.NodeFrom.data.y + (this.NodeFrom.data.height / 2);
        var x2 = this.NodeTo.data.x + (this.NodeTo.data.width / 2);
        var y2 = this.NodeTo.data.y + (this.NodeTo.data.height / 2);
        if (x1 > (x2 + this.NodeTo.data.width)) {
            x1 = this.NodeFrom.data.x;
            x2 = this.NodeTo.data.x + this.NodeTo.data.width;
        } else if (x2 > x1 + this.NodeFrom.data.width) {
            x1 = this.NodeFrom.data.x + this.NodeFrom.data.width;
            x2 = this.NodeTo.data.x;
        } else if (y1 > y2) {
            y1 = this.NodeFrom.data.y;
            y2 = this.NodeTo.data.y + this.NodeTo.data.height;
        } else {
            y1 = this.NodeFrom.data.y + this.NodeFrom.data.height;
            y2 = this.NodeTo.data.y;
        }
        this.pathGenerator.clear().moveTo(x1, y1);
        this.pathGenerator.lineTo(x2, y2);
        this.elLine.setAttribute('d', this.pathGenerator.end());
    }
    Remove() {
        var self = this;;
        this.NodeFrom.Lines = this.NodeFrom.Lines.filter((item) => self != item);
        this.NodeTo.Lines = this.NodeTo.Lines.filter((item) => self != item);
        this.elLine.remove();
    }
}
class NodeItem {
    data = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        title: 'node item',
        content: 'content',
    }
    Lines = [];
    isDown = false;
    offset = [];
    mousePosition = {};
    elNode;
    parent;
    constructor(data, parent) {
        this.parent = parent;
        this.data = data;

        if (this.data != undefined) {
            this.elNode = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this.elNode.innerHTML = `
            <rect x="0" y="50" width="188.3" height="37.3" rx="2" fill="rgb(255,229,153)" fill-opacity="1" stroke="rgb(0,0,0)" stroke-width="2.7"></rect>
            <text x="10" y="70" fill="rgb(0,0,0)" font-style="normal" font-weight="normal" font-size="17px"><tspan>PostgreSQL</tspan></text>`;
            var self = this;
            var isMove = false;
            document.addEventListener('mouseup', function (e) {
                self.isDown = false;
                document.body.style.cursor = '';
            });
            this.elNode.addEventListener('click', function (e) {
                if (!isMove)
                    setTimeout(function () {
                        self.parent.setNodeSelect(self);
                    }, 300);
            });
            this.elNode.addEventListener('dblclick', function (e) {
                if (!isMove && self.parent.nodeSelect == self)
                    self.AddChild();
            });
            this.elNode.addEventListener('mousedown', function (e) {
                self.isDown = true;
                isMove = false;
                document.body.style.cursor = 'pointer';
                self.offset = [
                    self.elNode.querySelector('rect').getAttribute('x') - e.clientX,
                    self.elNode.querySelector('rect').getAttribute('y') - e.clientY
                ];
            });
            this.parent.elCanvas.addEventListener('mousemove', function (e) {
                e.preventDefault();
                if (self.isDown) {
                    isMove = true;
                    self.mousePosition = {
                        x: e.clientX,
                        y: e.clientY
                    };
                    self.setPosition((self.mousePosition.x + self.offset[0]), (self.mousePosition.y + self.offset[1]));
                    self.Lines.forEach(function (_item) {
                        _item.UpdatePostion();
                    });
                }
            });
            this.parent.elCanvas.appendChild(this.elNode);
        }
    }
    //  The following two variables should really be passed as parameters
    setSVGtext(caption, MAXIMUM_CHARS_PER_LINE = 30, LINE_HEIGHT = 22) {
        //  This function attempts to create a new svg "text" element, chopping 
        //  it up into "tspan" pieces, if the caption is too long
        //
        var svgText = this.elNode.querySelector('text');

        svgText.innerHTML = "";
        var x = svgText.getAttributeNS(null, 'x'), y = svgText.getAttributeNS(null, 'y');
        var words = caption.split(" ");
        var line = "";

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + " ";
            if (testLine.length > MAXIMUM_CHARS_PER_LINE) {
                //  Add a new <tspan> element
                var svgTSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                svgTSpan.setAttributeNS(null, 'x', x);
                svgTSpan.setAttributeNS(null, 'y', y);

                var tSpanTextNode = document.createTextNode(line);
                svgTSpan.appendChild(tSpanTextNode);
                svgText.appendChild(svgTSpan);

                line = words[n] + " ";
                y = LINE_HEIGHT + parseFloat(y);
            }
            else {
                line = testLine;
            }
        }

        var svgTSpan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');

        var tSpanTextNode = document.createTextNode(line);
        svgTSpan.appendChild(tSpanTextNode);
        svgTSpan.setAttributeNS(null, 'x', x);
        svgTSpan.setAttributeNS(null, 'y', y);
        svgText.appendChild(svgTSpan);

        return svgText.innerHTML;
    }
    setTitle(title) {
        this.setSVGtext(title);
        this.data.title = title;
        var bbox = this.elNode.querySelector('text').getBBox();
        this.setSize(bbox.width, bbox.height);
        this.Lines.forEach(function (_item) {
            _item.UpdatePostion();
        });
    }
    setContent(content) {
        this.data.content = content;
    }
    setSize(width, height) {
        this.data.height = height + 20;
        this.data.width = width + 20;
        this.elNode.querySelector('rect').setAttribute('width', this.data.width);
        this.elNode.querySelector('rect').setAttribute('height', this.data.height);
        this.parent.UpdateSize();
    }
    setPosition(x, y) {
        this.elNode.querySelector('rect').setAttribute('x', x);
        this.elNode.querySelector('rect').setAttribute('y', y);
        this.elNode.querySelector('text').setAttribute('x', x + 10);
        this.elNode.querySelector('text').setAttribute('y', y + 20);
        this.data.x = x;
        this.data.y = y;
        this.setTitle(this.data.title);

    }
    DoDraw() {
        this.setPosition(this.data.x, this.data.y);

        return this;
    }
    AddChild() {
        var child = new NodeItem({
            id: new Date().getTime(),
            x: this.data.x,
            y: this.data.y + this.data.height + 30,
            title: this.data.title + " child",
            content: '',
            parentId: this.data.id,
        }, this.parent);
        child.DoDraw();
        new LineItem({ NodeFrom: this, NodeTo: child }, this.parent);
    }
}
class RoadMap {
    title = "";
    node = [
        {
            id: new Date().getTime(),
            x: 300,
            y: 10,
            title: 'Start RoadMap',
            content: '',
        },
    ];
    nodeItems = [];
    nodeSelect = undefined;
    elCanvas;
    elCardbox;
    elToolbar;
    elContainer;
    elProperty;
    elPropertyTitle;
    elPropertyContent;
    constructor(elContainer) {
        if (elContainer == undefined) {
            console.error('elContainer is undefined');
            DoClear();
            return;
        }
        this.elContainer = elContainer;
        this.BindEl();
        if (this.elCanvas == undefined) {
            this.loadTemplate();
            this.BindEl();
        }
    }
    BindEl() {
        this.elCanvas = this.elContainer.querySelector('.roadmap-canvas svg');
        if (this.elCanvas == undefined) return;
        this.elCardbox = this.elContainer.querySelector('.roadmap-cardbox');
        this.elToolbar = this.elContainer.querySelector('.roadmap-toolbar');
        this.elProperty = this.elContainer.querySelector('.roadmap-property');
        this.elPropertyTitle = this.elContainer.querySelector('.roadmap-property .node-title');
        this.elPropertyContent = this.elContainer.querySelector('.roadmap-property .node-content');
        var self = this;
        this.elProperty.style = "display:none";
        this.elPropertyTitle.addEventListener('keyup', function (e) {
            self.nodeSelect?.setTitle(e.target.value);
        }, true);
        this.elPropertyContent.addEventListener('keyup', function (e) {
            self.nodeSelect?.setContent(e.target.value);
        }, true);
        this.elContainer.querySelector('.roadmap-toolbar .btnSaveImage').addEventListener('click', function () {
            self.DoSave();
        })
        this.elContainer.querySelector('.roadmap-toolbar .btnSaveFile').addEventListener('click', function () {
            self.DoSaveFile();
        })
        this.elContainer.querySelector('.roadmap-toolbar .btnImportJSON').addEventListener('click', async function () {
            await self.DoImportFIle();
        })
    }
    loadTemplate() {
        this.elContainer.innerHTML = `<div class="roadmap-toolbar">
        <button class="btnSaveImage">Download Image</button>
        <button class="btnSaveFile">Export JSON</button>
        <button class="btnImportJSON">Import JSON</button>
        </div>
        <div class="roadmap-main" >
            <div class="roadmap-cardbox"></div>
            <div class="roadmap-canvas">            
                <svg xmlns="http://www.w3.org/2000/svg">
                </svg>
            </div>
            <div class="roadmap-property">
                <div class="roadmap-group-input">
                    <label>Title:</labeL>
                    <textarea class="roadmap-input node-title" ></textarea>
                </div>
                <div class="roadmap-group-input">
                    <label>Content:</labeL>
                    <textarea class="roadmap-input node-content" rows="5"></textarea>
                </div>
            </div>
        </div>`;
    }
    setNodeSelect(node) {
        this.nodeSelect = node;
        if (this.nodeSelect == undefined) {
            this.elProperty.style = "display:none";
            return;
        }
        this.elPropertyTitle.value = this.nodeSelect.data.title;
        this.elPropertyContent.value = this.nodeSelect.data.content;
        this.elProperty.style = "";
    }
    Import(data) {
        this.title = data?.title ?? "";
        this.node = data?.node ?? [];
        this.DoDrawNode();
    }
    ExportToJson() {
        return {
            title: this.title,
            node: this.node
        };
    }
    DoClear() {
        if (this.elCanvas != undefined) {
            this.elCanvas.innerHTML = ``;
        }
    }
    DoDraw() {
        self = this;
        this.nodeItems = this.node.map(_node => new NodeItem(_node, self).DoDraw());
        this.nodeItems.forEach(function (item) {
            var parent = self.nodeItems.filter(function (_node) {
                return item.data.parentId == _node.data.id;
            })
            if (parent.length > 0) {
                new LineItem({ NodeFrom: parent[0], NodeTo: item }, self);
            }
        })
    }
    UpdateSize() {
        var bbox = this.elCanvas.getBBox();
        this.elCanvas.setAttribute('width', `${bbox.x + bbox.width + 10}px`);
        this.elCanvas.setAttribute('height', `${bbox.y + bbox.height + 10}px`);
    }
    DoRun() {
        this.DoClear();
        this.DoDraw();
    }
    DoSave() {
        var self = this;
        this.SVGPNG(this.elCanvas, (function (e, e2) {
            self.download(e, "roadmap-project.png");
        }))
    }
    DoSaveFile() {
        this.node = this.nodeItems.map((item) => item.data);
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
            title: this.title,
            node: this.node
        }));
        this.download(dataStr, "roadmap-project.json");
    }
    async DoImportFIle() {
        const jsonFiles = await getJsonUpload();
        var jsonVar = JSON.parse(jsonFiles[0]);
        this.node = jsonVar.node;
        this.title = jsonVar.title;
        this.DoRun();
    }
    SVGPNG(svg, cb) {
        let temp = document.createElement("img");
        let DOMURL = window.URL || window.webkitURL || window;
        var svgText = svg.outerHTML;
        if (!svgText.match(/xmlns=\"/mi)) {
            svgText = svgText.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        }
        let imageSrc = DOMURL.createObjectURL(
            new Blob([svgText], { type: "image/svg+xml" })
        );
        var box = svg.getBBox();
        temp.width = box.x + box.width + 10;
        temp.height = box.y + box.height + 10;
        temp.src = imageSrc;
        temp.setAttribute("style", "position:fixed;left:-200vw;");
        document.body.appendChild(temp);
        temp.onload = function onload() {
            let canvas = document.createElement("canvas");
            canvas.width = temp.clientWidth;
            canvas.height = temp.clientHeight;
            let ctx = canvas.getContext("2d");

            ctx.drawImage(temp, 0, 0);
            let src = canvas.toDataURL("image/png");
            cb(src, canvas);
            temp.remove();
            URL.revokeObjectURL(imageSrc);
        };
    }
    download(href, name) {
        var a = document.createElement('a');

        a.download = name;
        a.href = href;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}