var {sample, where, max} = require('underscore');
var {SPACING} = require('./settings');
var {TWO_PI} = require('./helpers');

const RADIUS = 4;
const COLOR = 'rgba(0, 0, 0, 0.5)';

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = key(x, y);
        this.loc = [(x + 1) * SPACING, (y + 1) * SPACING];
        this.edges = [];
        this.policy = {};
    }
    addEdge(edge) {
        this.edges.push(edge);
    }
    removeEdge(edge) {
        var i = this.edges.indexOf(edge);
        if (i < 0) {
            return;
        }
        this.edges.splice(i, 1);
    }
    getNeighbors() {
        return this.edges.map((edge) => edge.getOtherNode(this));
    }
    selectEdge(smartOpts, smart, endNode) {
        if (!smart) {
            return sample(this.edges);
        }
        var {version, initial, explore} = smartOpts;
        _ensureDefaults(this.policy, version, endNode, this.edges, initial);
        var validActions = this.getValidActions(version, endNode);
        if (Math.random() > explore) {
            let maxValue = this.getMaxActionValue(smartOpts, endNode);
            validActions = where(validActions, {'value': maxValue});
        }
        var action = sample(validActions);
        return action && action['edge'];
    }
    getMaxActionValue(smartOpts, endNode) {
        var {version, initial} = smartOpts;
        _ensureDefaults(this.policy, version, endNode, this.edges, initial);
        var validActions = this.getValidActions(version, endNode);
        var maxAction = max(validActions, (action) => action.value);
        return maxAction['value'];
    }
    getValidActions(version, endNode) {
        var actions = Object.values(this.policy[version][endNode.id]);
        return actions.filter((action) => this.edges.includes(action.edge));
    }
    getEvaluationCb(smartOpts, endNode, edge) {
        var {version, alpha, discount} = smartOpts;
        return (reward, curMaxValue) => {
            var prevVal = this.policy[version][endNode.id][edge.id]['value'];
            var newVal = (1 - discount) * prevVal + alpha * (reward + discount * curMaxValue);
            this.policy[version][endNode.id][edge.id]['value'] = newVal;
        };
    }
    draw(ctx) {
        var [x, y] = this.loc;
        ctx.beginPath();
        ctx.arc(x, y, RADIUS, 0, TWO_PI);
        ctx.fillStyle = COLOR;
        ctx.fill();
    }
}

function key(x, y) {
    return x + '|' + y;
}

function _ensureDefaults(policy, policyVersion, endNode, edges, initial) {
    policy[policyVersion] = policy[policyVersion] || {};
    var curPolicy = policy[policyVersion];
    curPolicy[endNode.id] = curPolicy[endNode.id] || {};
    edges.forEach((edge) => {
        curPolicy[endNode.id][edge.id] = curPolicy[endNode.id][edge.id] || {
            'value': initial,
            'edge': edge
        };
    });
}

module.exports = Node;
