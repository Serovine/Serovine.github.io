/* ============================================================
   core.js — state & prompt (Tree Structure)
   ============================================================ */
const core = (() => {
    const state = {};
    const colorState = {}; // บันทึกสีแยกตามชื่อ { [tag]: { color1, color2, pattern } }

    function initState(db) {
        db.forEach(sec => {
            state[sec.id] = {};
            walkGroups(sec.groups, g => {
                state[sec.id][g.id] = (g.type === 'multi-pick' || g.type === 'select-multi') ? [] : null;
            });
        });
    }

    // ฟังก์ชันวนลูปทะลวงลงไปในชั้นลูกๆ
    function walkGroups(groups, cb) {
        (groups || []).forEach(g => {
            cb(g);
            (g.options || []).forEach(opt => {
                if (opt.children) walkGroups(opt.children, cb);
            });
        });
    }

    // หา Group ID ไม่ว่าจะซ่อนอยู่ลึกแค่ไหน
    function findGroupDeep(groups, groupId) {
        for (const g of (groups || [])) {
            if (g.id === groupId) return g;
            for (const opt of (g.options || [])) {
                if (opt.children) {
                    const found = findGroupDeep(opt.children, groupId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    // หาว่า Group นี้ เป็นลูกของ Tag ตัวไหน (เพื่อเอาไว้โชว์สีของแม่)
    function findParentTagOfGroup(groups, targetGroupId) {
        for (const g of (groups || [])) {
            for (const opt of (g.options || [])) {
                if (opt.children) {
                    if (opt.children.find(cg => cg.id === targetGroupId)) return { group: g, opt: opt };
                    const deeper = findParentTagOfGroup(opt.children, targetGroupId);
                    if (deeper) return deeper;
                }
            }
        }
        return null;
    }

    function select(secId, groupId, tag) {
        const v = state[secId][groupId];
        if (Array.isArray(v)) {
            const i = v.indexOf(tag);
            if (i > -1) v.splice(i, 1); else v.push(tag);
        } else {
            state[secId][groupId] = v === tag ? null : tag;
        }
    }

    function isSelected(secId, groupId, tag) {
        const v = state[secId]?.[groupId];
        return Array.isArray(v) ? v.includes(tag) : v === tag;
    }

    function getState(secId, groupId) {
        return state[secId]?.[groupId];
    }

    function getColorState(tag) {
        if (!colorState[tag]) colorState[tag] = {color1: null, color2: null, pattern: null};
        return colorState[tag];
    }

    function setColor(tag, slot, val) {
        const cs = getColorState(tag);
        if (slot === 1) cs.color1 = cs.color1 === val ? null : val;
        if (slot === 2) cs.color2 = cs.color2 === val ? null : val;
    }

    function setPattern(tag, val) {
        const cs = getColorState(tag);
        cs.pattern = cs.pattern === val ? null : val;
    }

    function clearColor(tag, slot) {
        const cs = getColorState(tag);
        if (slot === 1) cs.color1 = null;
        if (slot === 2) cs.color2 = null;
    }

    function buildPrompt(db) {
        const tagsOut = [];
        db.forEach(sec => {
            (sec.groups || []).forEach(g => buildGroupPrompt(sec.id, g, tagsOut));
        });
        return tagsOut.join(', ');
    }

    // ジェน Prompt แบบไล่สายเลือด (ถ้าไม่ได้เลือกแม่ ลูกก็จะไม่โผล่มา)
    function buildGroupPrompt(secId, g, tagsOut) {
        const v = state[secId][g.id];
        if (!v || (Array.isArray(v) && !v.length)) return;
        const arr = Array.isArray(v) ? v : [v];

        arr.forEach(tag => {
            const opt = (g.options || []).find(o => o.tag === tag);
            const cs = colorState[tag] || {};

            let outTag = tag;
            if (cs.pattern) outTag = `${cs.pattern} ${outTag}`;
            if (cs.color1 && cs.color2) outTag = `${cs.color1} ${cs.color2} ${outTag}`;
            else if (cs.color1) outTag = `${cs.color1} ${outTag}`;
            else if (cs.color2) outTag = `${cs.color2} ${outTag}`;

            tagsOut.push(outTag);

            if (opt && opt.children) {
                opt.children.forEach(cg => buildGroupPrompt(secId, cg, tagsOut));
            }
        });
    }

    function clearAll(db) {
        initState(db);
        for (let k in colorState) {
            colorState[k] = {color1: null, color2: null, pattern: null};
        }
    }

    function randomizeRecursive(secId, groups) {
        (groups || []).forEach(g => {
            if (!g.options || !g.options.length) return;
            const isMulti = (g.type === 'multi-pick' || g.type === 'select-multi');

            if (Math.random() > (isMulti ? 0.4 : 0.2)) {
                const opt = g.options[Math.floor(Math.random() * g.options.length)];
                state[secId][g.id] = isMulti ? [opt.tag] : opt.tag;

                if (opt.colorable) {
                    const colors = Object.keys(window.PALETTES || {});
                    if(colors.length) setColor(opt.tag, 1, colors[Math.floor(Math.random() * colors.length)]);
                }
                // สุ่มเมนูลูก เฉพาะตอนที่แม่โดนสุ่มเลือกเท่านั้น
                if (opt.children) randomizeRecursive(secId, opt.children);
            }
        });
    }

    function randomize(db) {
        clearAll(db);
        db.forEach(sec => randomizeRecursive(sec.id, sec.groups));
    }

    function hasAnySelection(secId) {
        let has = false;
        const sec = window.CHARACTER_DB.find(s => s.id === secId);
        if (!sec) return false;
        walkGroups(sec.groups, g => {
            const v = state[secId]?.[g.id];
            if (Array.isArray(v) ? v.length > 0 : v !== null) has = true;
        });
        return has;
    }

    return {
        initState, findGroupDeep, findParentTagOfGroup, walkGroups,
        select, isSelected, getState,
        getColorState, setColor, setPattern, clearColor,
        buildPrompt, clearAll, randomize, hasAnySelection
    };
})();