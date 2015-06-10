function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }

/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WebInspector.TimelineDataGrid = function (treeOutline, columns, delegate, editCallback, deleteCallback) {
    WebInspector.DataGrid.call(this, columns, editCallback, deleteCallback);

    this._treeOutlineDataGridSynchronizer = new WebInspector.TreeOutlineDataGridSynchronizer(treeOutline, this, delegate);

    this.element.classList.add(WebInspector.TimelineDataGrid.StyleClassName);

    this._filterableColumns = [];

    // Check if any of the cells can be filtered.
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = this.columns[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _step$value = _slicedToArray(_step.value, 2);

            var identifier = _step$value[0];
            var column = _step$value[1];

            var scopeBar = column.scopeBar;
            if (!scopeBar) continue;
            this._filterableColumns.push(identifier);
            scopeBar.columnIdentifier = identifier;
            scopeBar.addEventListener(WebInspector.ScopeBar.Event.SelectionChanged, this._scopeBarSelectedItemsDidChange, this);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator["return"]) {
                _iterator["return"]();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    if (this._filterableColumns.length > 1) {
        console.error("Creating a TimelineDataGrid with more than one filterable column is not yet supported.");
        return;
    }

    if (this._filterableColumns.length) {
        var items = [new WebInspector.FlexibleSpaceNavigationItem(), this.columns.get(this._filterableColumns[0]).scopeBar, new WebInspector.FlexibleSpaceNavigationItem()];
        this._navigationBar = new WebInspector.NavigationBar(null, items);
        var container = this.element.appendChild(document.createElement("div"));
        container.className = "navigation-bar-container";
        container.appendChild(this._navigationBar.element);

        this._updateScopeBarForcedVisibility();
    }

    this.addEventListener(WebInspector.DataGrid.Event.SelectedNodeChanged, this._dataGridSelectedNodeChanged, this);
    this.addEventListener(WebInspector.DataGrid.Event.SortChanged, this._sort, this);

    window.addEventListener("resize", this);
};

WebInspector.TimelineDataGrid.StyleClassName = "timeline";
WebInspector.TimelineDataGrid.HasNonDefaultFilterStyleClassName = "has-non-default-filter";
WebInspector.TimelineDataGrid.DelayedPopoverShowTimeout = 250;
WebInspector.TimelineDataGrid.DelayedPopoverHideContentClearTimeout = 500;

WebInspector.TimelineDataGrid.Event = {
    FiltersDidChange: "timelinedatagrid-filters-did-change"
};

WebInspector.TimelineDataGrid.createColumnScopeBar = function (prefix, map) {
    prefix = prefix + "-timeline-data-grid-";

    var scopeBarItems = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = map[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _step2$value = _slicedToArray(_step2.value, 2);

            var key = _step2$value[0];
            var value = _step2$value[1];

            var id = prefix + key;
            var item = new WebInspector.ScopeBarItem(id, value);
            item.value = key;
            scopeBarItems.push(item);
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                _iterator2["return"]();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    scopeBarItems.unshift(new WebInspector.ScopeBarItem(prefix + "type-all", WebInspector.UIString("All"), true));

    return new WebInspector.ScopeBar(prefix + "scope-bar", scopeBarItems, scopeBarItems[0]);
};

WebInspector.TimelineDataGrid.prototype = {
    constructor: WebInspector.TimelineDataGrid,
    __proto__: WebInspector.DataGrid.prototype,

    // Public

    reset: function reset() {
        // May be overridden by subclasses. If so, they should call the superclass.

        this._hidePopover();
    },

    shown: function shown() {
        // May be overridden by subclasses. If so, they should call the superclass.

        this._treeOutlineDataGridSynchronizer.synchronize();
    },

    hidden: function hidden() {
        // May be overridden by subclasses. If so, they should call the superclass.

        this._hidePopover();
    },

    closed: function closed() {
        window.removeEventListener("resize", this);
    },

    treeElementForDataGridNode: function treeElementForDataGridNode(dataGridNode) {
        return this._treeOutlineDataGridSynchronizer.treeElementForDataGridNode(dataGridNode);
    },

    dataGridNodeForTreeElement: function dataGridNodeForTreeElement(treeElement) {
        return this._treeOutlineDataGridSynchronizer.dataGridNodeForTreeElement(treeElement);
    },

    callFramePopoverAnchorElement: function callFramePopoverAnchorElement() {
        // Implemented by subclasses.
        return null;
    },

    updateLayout: function updateLayout() {
        WebInspector.DataGrid.prototype.updateLayout.call(this);

        if (this._navigationBar) this._navigationBar.updateLayout();
    },

    treeElementMatchesActiveScopeFilters: function treeElementMatchesActiveScopeFilters(treeElement) {
        var dataGridNode = this._treeOutlineDataGridSynchronizer.dataGridNodeForTreeElement(treeElement);
        console.assert(dataGridNode);

        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = this._filterableColumns[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var identifier = _step3.value;

                var scopeBar = this.columns.get(identifier).scopeBar;
                if (!scopeBar || scopeBar.defaultItem.selected) continue;

                var value = dataGridNode.data[identifier];
                var matchesFilter = scopeBar.selectedItems.some(function (scopeBarItem) {
                    return scopeBarItem.value === value;
                });

                if (!matchesFilter) return false;
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                    _iterator3["return"]();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
                }
            }
        }

        return true;
    },

    addRowInSortOrder: function addRowInSortOrder(treeElement, dataGridNode, parentElement) {
        this._treeOutlineDataGridSynchronizer.associate(treeElement, dataGridNode);

        parentElement = parentElement || this._treeOutlineDataGridSynchronizer.treeOutline;
        var parentNode = parentElement.root ? this : this._treeOutlineDataGridSynchronizer.dataGridNodeForTreeElement(parentElement);

        console.assert(parentNode);

        if (this.sortColumnIdentifier) {
            var insertionIndex = insertionIndexForObjectInListSortedByFunction(dataGridNode, parentNode.children, this._sortComparator.bind(this));

            // Insert into the parent, which will cause the synchronizer to insert into the data grid.
            parentElement.insertChild(treeElement, insertionIndex);
        } else {
            // Append to the parent, which will cause the synchronizer to append to the data grid.
            parentElement.appendChild(treeElement);
        }
    },

    shouldIgnoreSelectionEvent: function shouldIgnoreSelectionEvent() {
        return this._ignoreSelectionEvent || false;
    },

    // Protected

    handleEvent: function handleEvent(event) {
        console.assert(event.type === "resize");

        this._windowResized(event);
    },

    dataGridNodeNeedsRefresh: function dataGridNodeNeedsRefresh(dataGridNode) {
        if (!this._dirtyDataGridNodes) this._dirtyDataGridNodes = new Set();
        this._dirtyDataGridNodes.add(dataGridNode);

        if (this._scheduledDataGridNodeRefreshIdentifier) return;

        this._scheduledDataGridNodeRefreshIdentifier = requestAnimationFrame(this._refreshDirtyDataGridNodes.bind(this));
    },

    // Private

    _refreshDirtyDataGridNodes: function _refreshDirtyDataGridNodes() {
        if (this._scheduledDataGridNodeRefreshIdentifier) {
            cancelAnimationFrame(this._scheduledDataGridNodeRefreshIdentifier);
            delete this._scheduledDataGridNodeRefreshIdentifier;
        }

        if (!this._dirtyDataGridNodes) return;

        var selectedNode = this.selectedNode;
        var sortComparator = this._sortComparator.bind(this);
        var treeOutline = this._treeOutlineDataGridSynchronizer.treeOutline;

        this._treeOutlineDataGridSynchronizer.enabled = false;

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = this._dirtyDataGridNodes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var dataGridNode = _step4.value;

                dataGridNode.refresh();

                if (!this.sortColumnIdentifier) continue;

                if (dataGridNode === selectedNode) this._ignoreSelectionEvent = true;

                var treeElement = this._treeOutlineDataGridSynchronizer.treeElementForDataGridNode(dataGridNode);
                console.assert(treeElement);

                treeOutline.removeChild(treeElement);
                this.removeChild(dataGridNode);

                var insertionIndex = insertionIndexForObjectInListSortedByFunction(dataGridNode, this.children, sortComparator);
                treeOutline.insertChild(treeElement, insertionIndex);
                this.insertChild(dataGridNode, insertionIndex);

                // Adding the tree element back to the tree outline subjects it to filters.
                // Make sure we keep the hidden state in-sync while the synchronizer is disabled.
                dataGridNode.element.classList.toggle("hidden", treeElement.hidden);

                if (dataGridNode === selectedNode) {
                    selectedNode.revealAndSelect();
                    delete this._ignoreSelectionEvent;
                }
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
                    _iterator4["return"]();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }

        this._treeOutlineDataGridSynchronizer.enabled = true;

        delete this._dirtyDataGridNodes;
    },

    _sort: function _sort() {
        var sortColumnIdentifier = this.sortColumnIdentifier;
        if (!sortColumnIdentifier) return;

        var selectedNode = this.selectedNode;
        this._ignoreSelectionEvent = true;

        this._treeOutlineDataGridSynchronizer.enabled = false;

        var treeOutline = this._treeOutlineDataGridSynchronizer.treeOutline;
        if (treeOutline.selectedTreeElement) treeOutline.selectedTreeElement.deselect(true);

        // Collect parent nodes that need their children sorted. So this in two phases since
        // traverseNextNode would get confused if we sort the tree while traversing it.
        var parentDataGridNodes = [this];
        var currentDataGridNode = this.children[0];
        while (currentDataGridNode) {
            if (currentDataGridNode.children.length) parentDataGridNodes.push(currentDataGridNode);
            currentDataGridNode = currentDataGridNode.traverseNextNode(false, null, true);
        }

        // Sort the children of collected parent nodes.
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
            for (var _iterator5 = parentDataGridNodes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var parentDataGridNode = _step5.value;

                var parentTreeElement = parentDataGridNode === this ? treeOutline : this._treeOutlineDataGridSynchronizer.treeElementForDataGridNode(parentDataGridNode);
                console.assert(parentTreeElement);

                var childDataGridNodes = parentDataGridNode.children.slice();

                parentDataGridNode.removeChildren();
                parentTreeElement.removeChildren();

                childDataGridNodes.sort(this._sortComparator.bind(this));

                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = childDataGridNodes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var dataGridNode = _step6.value;

                        var treeElement = this._treeOutlineDataGridSynchronizer.treeElementForDataGridNode(dataGridNode);
                        console.assert(treeElement);

                        parentTreeElement.appendChild(treeElement);
                        parentDataGridNode.appendChild(dataGridNode);

                        // Adding the tree element back to the tree outline subjects it to filters.
                        // Make sure we keep the hidden state in-sync while the synchronizer is disabled.
                        dataGridNode.element.classList.toggle("hidden", treeElement.hidden);
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
                            _iterator6["return"]();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }
            }
        } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
                    _iterator5["return"]();
                }
            } finally {
                if (_didIteratorError5) {
                    throw _iteratorError5;
                }
            }
        }

        this._treeOutlineDataGridSynchronizer.enabled = true;

        if (selectedNode) selectedNode.revealAndSelect();

        delete this._ignoreSelectionEvent;
    },

    _sortComparator: function _sortComparator(node1, node2) {
        var sortColumnIdentifier = this.sortColumnIdentifier;
        if (!sortColumnIdentifier) return 0;

        var sortDirection = this.sortOrder === WebInspector.DataGrid.SortOrder.Ascending ? 1 : -1;

        var value1 = node1.data[sortColumnIdentifier];
        var value2 = node2.data[sortColumnIdentifier];

        if (typeof value1 === "number" && typeof value2 === "number") {
            if (isNaN(value1) && isNaN(value2)) return 0;
            if (isNaN(value1)) return -sortDirection;
            if (isNaN(value2)) return sortDirection;
            return (value1 - value2) * sortDirection;
        }

        if (typeof value1 === "string" && typeof value2 === "string") return value1.localeCompare(value2) * sortDirection;

        if (value1 instanceof WebInspector.CallFrame || value2 instanceof WebInspector.CallFrame) {
            // Sort by function name if available, then fall back to the source code object.
            value1 = value1 && value1.functionName ? value1.functionName : value1 && value1.sourceCodeLocation ? value1.sourceCodeLocation.sourceCode : "";
            value2 = value2 && value2.functionName ? value2.functionName : value2 && value2.sourceCodeLocation ? value2.sourceCodeLocation.sourceCode : "";
        }

        if (value1 instanceof WebInspector.SourceCode || value2 instanceof WebInspector.SourceCode) {
            value1 = value1 ? value1.displayName || "" : "";
            value2 = value2 ? value2.displayName || "" : "";
        }

        // For everything else (mostly booleans).
        return (value1 < value2 ? -1 : value1 > value2 ? 1 : 0) * sortDirection;
    },

    _updateScopeBarForcedVisibility: function _updateScopeBarForcedVisibility() {
        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
            for (var _iterator7 = this._filterableColumns[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                var identifier = _step7.value;

                var scopeBar = this.columns.get(identifier).scopeBar;
                if (scopeBar) {
                    this.element.classList.toggle(WebInspector.TimelineDataGrid.HasNonDefaultFilterStyleClassName, scopeBar.hasNonDefaultItemSelected());
                    break;
                }
            }
        } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion7 && _iterator7["return"]) {
                    _iterator7["return"]();
                }
            } finally {
                if (_didIteratorError7) {
                    throw _iteratorError7;
                }
            }
        }
    },

    _scopeBarSelectedItemsDidChange: function _scopeBarSelectedItemsDidChange(event) {
        this._updateScopeBarForcedVisibility();

        var columnIdentifier = event.target.columnIdentifier;
        this.dispatchEventToListeners(WebInspector.TimelineDataGrid.Event.FiltersDidChange, { columnIdentifier: columnIdentifier });
    },

    _dataGridSelectedNodeChanged: function _dataGridSelectedNodeChanged(event) {
        if (!this.selectedNode) {
            this._hidePopover();
            return;
        }

        var record = this.selectedNode.record;
        if (!record || !record.callFrames || !record.callFrames.length) {
            this._hidePopover();
            return;
        }

        this._showPopoverForSelectedNodeSoon();
    },

    _windowResized: function _windowResized(event) {
        if (this._popover && this._popover.visible) this._updatePopoverForSelectedNode(false);
    },

    _showPopoverForSelectedNodeSoon: function _showPopoverForSelectedNodeSoon() {
        if (this._showPopoverTimeout) return;

        function delayedWork() {
            if (!this._popover) this._popover = new WebInspector.Popover();

            this._updatePopoverForSelectedNode(true);
        }

        this._showPopoverTimeout = setTimeout(delayedWork.bind(this), WebInspector.TimelineDataGrid.DelayedPopoverShowTimeout);
    },

    _hidePopover: function _hidePopover() {
        if (this._showPopoverTimeout) {
            clearTimeout(this._showPopoverTimeout);
            delete this._showPopoverTimeout;
        }

        if (this._popover) this._popover.dismiss();

        function delayedWork() {
            if (this._popoverCallStackTreeOutline) this._popoverCallStackTreeOutline.removeChildren();
        }

        if (this._hidePopoverContentClearTimeout) clearTimeout(this._hidePopoverContentClearTimeout);
        this._hidePopoverContentClearTimeout = setTimeout(delayedWork.bind(this), WebInspector.TimelineDataGrid.DelayedPopoverHideContentClearTimeout);
    },

    _updatePopoverForSelectedNode: function _updatePopoverForSelectedNode(updateContent) {
        if (!this._popover || !this.selectedNode) return;

        var targetPopoverElement = this.callFramePopoverAnchorElement();
        console.assert(targetPopoverElement, "TimelineDataGrid subclass should always return a valid element from callFramePopoverAnchorElement.");
        if (!targetPopoverElement) return;

        var targetFrame = WebInspector.Rect.rectFromClientRect(targetPopoverElement.getBoundingClientRect());

        // The element might be hidden if it does not have a width and height.
        if (!targetFrame.size.width && !targetFrame.size.height) return;

        if (this._hidePopoverContentClearTimeout) {
            clearTimeout(this._hidePopoverContentClearTimeout);
            delete this._hidePopoverContentClearTimeout;
        }

        if (updateContent) this._popover.content = this._createPopoverContent();

        this._popover.present(targetFrame.pad(2), [WebInspector.RectEdge.MAX_Y, WebInspector.RectEdge.MIN_Y, WebInspector.RectEdge.MAX_X]);
    },

    _createPopoverContent: function _createPopoverContent() {
        if (!this._popoverCallStackTreeOutline) {
            var contentElement = document.createElement("ol");
            contentElement.classList.add("timeline-data-grid-tree-outline");
            this._popoverCallStackTreeOutline = new WebInspector.TreeOutline(contentElement);
            this._popoverCallStackTreeOutline.onselect = this._popoverCallStackTreeElementSelected.bind(this);
        } else this._popoverCallStackTreeOutline.removeChildren();

        var callFrames = this.selectedNode.record.callFrames;
        for (var i = 0; i < callFrames.length; ++i) {
            var callFrameTreeElement = new WebInspector.CallFrameTreeElement(callFrames[i]);
            this._popoverCallStackTreeOutline.appendChild(callFrameTreeElement);
        }

        var content = document.createElement("div");
        content.className = "timeline-data-grid-popover";
        content.appendChild(this._popoverCallStackTreeOutline.element);
        return content;
    },

    _popoverCallStackTreeElementSelected: function _popoverCallStackTreeElementSelected(treeElement, selectedByUser) {
        this._popover.dismiss();

        console.assert(treeElement instanceof WebInspector.CallFrameTreeElement, "TreeElements in TimelineDataGrid popover should always be CallFrameTreeElements");
        var callFrame = treeElement.callFrame;
        if (!callFrame.sourceCodeLocation) return;

        WebInspector.showSourceCodeLocation(callFrame.sourceCodeLocation);
    }
};