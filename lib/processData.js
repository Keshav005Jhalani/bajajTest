function validateEntry(raw) {
  const entry = raw.trim();
  const pattern = /^([A-Z])->([A-Z])$/;
  const match = entry.match(pattern);
  if (!match) return { valid: false, entry };
  const [, parent, child] = match;
  if (parent === child) return { valid: false, entry };
  return { valid: true, parent, child, entry };
}

function hasCycle(nodes, adjacency) {
  const visited = new Set();
  const inStack = new Set();

  function dfs(node) {
    visited.add(node);
    inStack.add(node);
    for (const neighbor of adjacency[node] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true;
      }
    }
    inStack.delete(node);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

function buildTree(rootNode, adjacency) {
  function recurse(node) {
    const children = adjacency[node] || [];
    const obj = {};
    for (const child of children) {
      obj[child] = recurse(child);
    }
    return obj;
  }
  return { [rootNode]: recurse(rootNode) };
}

function calcDepth(tree, root) {
  function recurse(node, obj) {
    const children = Object.keys(obj);
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map((c) => recurse(c, obj[c])));
  }
  return recurse(root, tree[root]);
}

function processData(dataArray) {
  const invalidEntries = [];
  const duplicateEdges = [];
  const seenEdges = new Set();
  const childParentMap = {};
  const adjacency = {};
  const allNodes = new Set();

  for (const raw of dataArray) {
    const result = validateEntry(raw);
    if (!result.valid) {
      invalidEntries.push(raw.trim());
      continue;
    }

    const { parent, child } = result;
    const edgeKey = `${parent}->${child}`;

    if (seenEdges.has(edgeKey)) {
      if (!duplicateEdges.includes(edgeKey)) {
        duplicateEdges.push(edgeKey);
      }
      continue;
    }

    seenEdges.add(edgeKey);

    if (childParentMap[child] !== undefined) {
      continue;
    }

    childParentMap[child] = parent;

    if (!adjacency[parent]) adjacency[parent] = [];
    adjacency[parent].push(child);

    allNodes.add(parent);
    allNodes.add(child);
  }

  const visited = new Set();
  const components = [];

  function bfsComponent(startNode) {
    const queue = [startNode];
    const component = new Set();
    visited.add(startNode);

    while (queue.length > 0) {
      const node = queue.shift();
      component.add(node);

      for (const child of adjacency[node] || []) {
        if (!visited.has(child)) {
          visited.add(child);
          queue.push(child);
        }
      }

      for (const n of allNodes) {
        if ((adjacency[n] || []).includes(node) && !visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    return component;
  }

  for (const node of allNodes) {
    if (!visited.has(node)) {
      components.push(bfsComponent(node));
    }
  }

  const hierarchies = [];
  let totalCycles = 0;
  let totalTrees = 0;
  let largestDepth = -1;
  let largestRoot = null;

  for (const component of components) {
    const nodes = [...component];
    const childNodes = new Set();

    for (const n of nodes) {
      for (const c of adjacency[n] || []) {
        childNodes.add(c);
      }
    }

    const roots = nodes.filter((n) => !childNodes.has(n));

    let root;
    if (roots.length > 0) {
      root = roots.sort()[0];
    } else {
      root = nodes.sort()[0];
    }

    const compAdjacency = {};
    for (const n of nodes) {
      if (adjacency[n]) compAdjacency[n] = adjacency[n];
    }

    const cycleDetected = hasCycle(nodes, compAdjacency);

    if (cycleDetected) {
      totalCycles++;
      hierarchies.push({
        root,
        tree: {},
        has_cycle: true,
      });
    } else {
      totalTrees++;
      const tree = buildTree(root, compAdjacency);
      const depth = calcDepth(tree, root);

      hierarchies.push({
        root,
        tree,
        depth,
      });

      if (
        depth > largestDepth ||
        (depth === largestDepth && root < largestRoot)
      ) {
        largestDepth = depth;
        largestRoot = root;
      }
    }
  }

  hierarchies.sort((a, b) => a.root.localeCompare(b.root));

  const summary = {
    total_trees: totalTrees,
    total_cycles: totalCycles,
    largest_tree_root: largestRoot || "",
  };

  return { hierarchies, invalidEntries, duplicateEdges, summary };
}

module.exports = { processData };
