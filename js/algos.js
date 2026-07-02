(function () {
    'use strict';
    function swap(a, i, j) { const t = a[i]; a[i] = a[j]; a[j] = t; }
    function heapify(a, n, i) {
        let largest = i;
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && a[l] > a[largest])
            largest = l;
        if (r < n && a[r] > a[largest])
            largest = r;
        if (largest !== i) {
            swap(a, i, largest);
            heapify(a, n, largest);
        }
    }
    function heapsort(arr) {
        const a = arr.slice();
        const n = a.length;
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--)
            heapify(a, n, i);
        for (let i = n - 1; i > 0; i--) {
            swap(a, 0, i);
            heapify(a, i, 0);
        }
        return a;
    }
    function mergesort(arr) {
        if (arr.length <= 1)
            return arr.slice();
        const mid = Math.floor(arr.length / 2);
        const left = mergesort(arr.slice(0, mid));
        const right = mergesort(arr.slice(mid));
        const out = [];
        let i = 0, j = 0;
        while (i < left.length && j < right.length) {
            if (left[i] <= right[j])
                out.push(left[i++]);
            else
                out.push(right[j++]);
        }
        while (i < left.length)
            out.push(left[i++]);
        while (j < right.length)
            out.push(right[j++]);
        return out;
    }
    function quicksort3(arr) {
        const a = arr.slice();
        function sort(lo, hi) {
            if (lo >= hi)
                return;
            const pivot = a[Math.floor((lo + hi) / 2)];
            let lt = lo, i = lo, gt = hi;
            while (i <= gt) {
                if (a[i] < pivot) {
                    swap(a, lt++, i++);
                }
                else if (a[i] > pivot) {
                    swap(a, i, gt--);
                }
                else {
                    i++;
                }
            }
            sort(lo, lt - 1);
            sort(gt + 1, hi);
        }
        sort(0, a.length - 1);
        return a;
    }
    function radixSortNonNegative(arr) {
        const a = arr.slice();
        if (a.length === 0)
            return a;
        let max = 0;
        for (const x of a) {
            if (x < 0)
                throw new Error('radixSortNonNegative requires non-negative integers');
            if (x > max)
                max = x;
        }
        let exp = 1;
        const output = new Array(a.length);
        while (Math.floor(max / exp) > 0) {
            const count = new Array(10).fill(0);
            for (let i = 0; i < a.length; i++)
                count[Math.floor(a[i] / exp) % 10]++;
            for (let i = 1; i < 10; i++)
                count[i] += count[i - 1];
            for (let i = a.length - 1; i >= 0; i--)
                output[--count[Math.floor(a[i] / exp) % 10]] = a[i];
            for (let i = 0; i < a.length; i++)
                a[i] = output[i];
            exp *= 10;
        }
        return a;
    }
    class MinHeap {
        constructor() { this.h = []; }
        size() { return this.h.length; }
        peek() { return this.h[0]; }
        push(val) {
            const h = this.h;
            h.push(val);
            let i = h.length - 1;
            while (i > 0) {
                const p = (i - 1) >> 1;
                if (h[p] <= h[i])
                    break;
                const t = h[p];
                h[p] = h[i];
                h[i] = t;
                i = p;
            }
        }
        pop() {
            const h = this.h;
            if (h.length === 0)
                return undefined;
            const top = h[0];
            const last = h.pop();
            if (h.length > 0) {
                h[0] = last;
                let i = 0;
                while (true) {
                    const l = 2 * i + 1, r = 2 * i + 2;
                    let s = i;
                    if (l < h.length && h[l] < h[s])
                        s = l;
                    if (r < h.length && h[r] < h[s])
                        s = r;
                    if (s === i)
                        break;
                    const t = h[i];
                    h[i] = h[s];
                    h[s] = t;
                    i = s;
                }
            }
            return top;
        }
    }
    class LRUCache {
        constructor(capacity = 128) { this.capacity = capacity; this.map = new Map(); this.head = null; this.tail = null; }
        _remove(node) { if (node.prev)
            node.prev.next = node.next;
        else
            this.head = node.next; if (node.next)
            node.next.prev = node.prev;
        else
            this.tail = node.prev; node.prev = null; node.next = null; }
        _addFront(node) { node.prev = null; node.next = this.head; if (this.head)
            this.head.prev = node; this.head = node; if (!this.tail)
            this.tail = node; }
        get(key) { const n = this.map.get(key); if (!n)
            return undefined; this._remove(n); this._addFront(n); return n.val; }
        set(key, val) { let n = this.map.get(key); if (n) {
            n.val = val;
            this._remove(n);
            this._addFront(n);
            return;
        } n = { key, val, prev: null, next: null }; this.map.set(key, n); this._addFront(n); if (this.map.size > this.capacity) {
            const lru = this.tail;
            this._remove(lru);
            this.map.delete(lru.key);
        } }
        has(key) { return this.map.has(key); }
        size() { return this.map.size; }
    }
    class FenwickTree {
        constructor(n) { this.n = n; this.bit = new Array(n + 1).fill(0); }
        add(i, delta) { for (; i <= this.n; i += i & -i)
            this.bit[i] += delta; }
        sum(i) { let s = 0; for (; i > 0; i -= i & -i)
            s += this.bit[i]; return s; }
        rangeSum(l, r) { return this.sum(r) - this.sum(l - 1); }
    }
    class UnionFind {
        constructor(n) { this.parent = Array.from({ length: n }, (_, i) => i); this.rank = new Array(n).fill(0); this.count = n; }
        find(x) { if (this.parent[x] !== x)
            this.parent[x] = this.find(this.parent[x]); return this.parent[x]; }
        union(a, b) { let ra = this.find(a), rb = this.find(b); if (ra === rb)
            return false; if (this.rank[ra] < this.rank[rb])
            [ra, rb] = [rb, ra]; this.parent[rb] = ra; if (this.rank[ra] === this.rank[rb])
            this.rank[ra]++; this.count--; return true; }
        connected(a, b) { return this.find(a) === this.find(b); }
        components() { return this.count; }
    }
    function benchmarkSorts(n = 5000) {
        const nums = Array.from({ length: n }, () => (Math.random() * 1e6) | 0);
        const suites = [
            ['quicksort3', quicksort3],
            ['mergesort', mergesort],
            ['heapsort', heapsort],
            ['radixSortNonNegative', radixSortNonNegative]
        ];
        const results = [];
        for (const [name, fn] of suites) {
            const t0 = performance.now();
            const out = fn(nums);
            const t1 = performance.now();
            let ok = true;
            for (let i = 1; i < out.length; i++) {
                if (out[i - 1] > out[i]) {
                    ok = false;
                    break;
                }
            }
            results.push({ name, ms: +(t1 - t0).toFixed(2), ok });
        }
        return results;
    }
    window.Algos = {
        heapsort, mergesort, quicksort3, radixSortNonNegative,
        MinHeap, LRUCache, FenwickTree, UnionFind,
        benchmarkSorts,
        parseNumbers(text) {
            return (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number).filter(n => Number.isFinite(n));
        }
    };
})();
