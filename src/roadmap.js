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
        if (y1 < y2 && x1 < x2) {
            x1 = this.NodeFrom.data.x + this.NodeFrom.data.width;
            x2 = this.NodeTo.data.x;
        }
        if (y1 < y2 && x1 > x2) {
            x1 = this.NodeFrom.data.x;
            x2 = this.NodeTo.data.x + this.NodeTo.data.width;
        }
        if (y1 > y2 && x1 < x2) {
            y1 = this.NodeFrom.data.y + this.NodeFrom.data.height;
            y2 = this.NodeTo.data.y;
        }
        if (y1 > y2 && x1 > x2) {
            y1 = this.NodeFrom.data.y;
            y2 = this.NodeTo.data.y + this.NodeTo.data.height;
        }
        this.pathGenerator.clear().moveTo(x1, y1);
        this.pathGenerator.lineTo(x2, y2);
        this.elLine.setAttribute('d', this.pathGenerator.end());
    }
    Remove() {
        this.NodeFrom.Lines.remove(this);
        this.NodeTo.Lines.remove(this);
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
            document.addEventListener('mouseup', function (e) {
                self.isDown = false;
                document.body.style.cursor = '';
            });

            this.elNode.addEventListener('mousedown', function (e) {
                self.isDown = true;
                document.body.style.cursor = 'pointer';
                self.offset = [
                    self.elNode.querySelector('rect').getAttribute('x') - e.clientX,
                    self.elNode.querySelector('rect').getAttribute('y') - e.clientY
                ];
            });
            this.parent.elCanvas.addEventListener('mousemove', function (e) {
                e.preventDefault();
                if (self.isDown) {
                    self.mousePosition = {
                        x: e.clientX,
                        y: e.clientY
                    };
                    self.setPosition((self.mousePosition.x + self.offset[0]), (self.mousePosition.y + self.offset[1]));
                    self.Lines.forEach(function (_item) {
                        _item.UpdatePostion();
                        console.log(_item);
                    });
                }
            });
            this.parent.elCanvas.appendChild(this.elNode);

        }
    }
    setTitle(title) {
        this.elNode.querySelector('text tspan').innerHTML = title;
        this.data.title = title;
        var bbox = this.elNode.querySelector('text').getBBox();
        this.setSize(bbox.width, bbox.height);
    }
    setBoby(content) {
        this.data.content = content;
    }
    setSize(width, height) {
        this.data.height = height + 20;
        this.data.width = width + 20;
        this.elNode.querySelector('rect').setAttribute('width', this.data.width);
        this.elNode.querySelector('rect').setAttribute('height', this.data.height);
    }
    setPosition(x, y) {
        this.elNode.querySelector('rect').setAttribute('x', x);
        this.elNode.querySelector('rect').setAttribute('y', y);
        this.elNode.querySelector('text').setAttribute('x', x + 10);
        this.elNode.querySelector('text').setAttribute('y', y + 20);
        this.data.x = x;
        this.data.y = y;
    }
    DoDraw() {
        this.setPosition(this.data.x, this.data.y);
        this.setTitle(this.data.title);
        return this;
    }
}
class RoadMap {
    title = "";
    node = [
        {
            id: 1234,
            parentId: 1235,
            x: 100,
            y: 20,
            title: 'node item',
            content: 'content',
        },
        {
            id: 1235,
            parentId: 1236,
            x: 300,
            y: 120,
            title: 'node item343434',
            content: 'content',
        },
        {
            id: 1236,
            parentId: 1234,
            x: 100,
            y: 420,
            title: 'node item32323232dfssdsdg',
            content: 'content',
        },
        {
            id: 1237,
            parentId: 1234,
            x: 600,
            y: 420,
            title: 'node nội dung 1',
            content: 'content',
        }
    ];
    nodeItems = [];
    elCanvas;
    elCardbox;
    elToolbar;
    elContainer;
    constructor(elContainer) {
        if (elContainer == undefined) {
            console.error('elContainer is undefined');
            DoClear();
            return;
        }
        this.elContainer = elContainer;
        this.BindEl();
        if (this.elCanvas == undefined) {
            console.log(1);
            this.loadTemplate();
            this.BindEl();
        }
    }
    BindEl() {
        this.elCanvas = this.elContainer.querySelector('.roadmap-canvas');
        this.elCardbox = this.elContainer.querySelector('.roadmap-cardbox');
        this.elToolbar = this.elContainer.querySelector('.roadmap-toolbar');
    }
    loadTemplate() {
        this.elContainer.innerHTML = `<div class="roadmap-toolbar">
        </div>
        <div class="roadmap-main" >
            <div class="roadmap-cardbox"></div>
            <svg xmlns="http://www.w3.org/2000/svg" class="roadmap-canvas">
            </svg>
        </div>`;
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
    DoRun() {
        this.DoClear();
        this.DoDraw();
    }
}