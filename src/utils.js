import { useEffect, useState, useCallback } from 'react'

export const useSyncCallback = callback => {
    const [proxyState, setProxyState] = useState({ current: false })

    const Func = useCallback(() => {
        setProxyState({ current: true })
    }, [])

    useEffect(() => {
        if (proxyState.current === true) setProxyState({ current: false })
    }, [proxyState])

    useEffect(() => {
        proxyState.current && callback()
    })

    return Func
}

export async function postRequest(url) {
    const resp = await fetch(url, {
        method: 'POST',
    })
    const json = await resp?.json()
    return json?.code != 200 ? null : json
}

export async function textRequest(url) {
    const resp = await fetch(url)
    const text = await resp?.text()

    return text?.includes('faild') ? null : text
}

export function filterFile(file) {
    return file.name.includes('.md') && !file.name.toLowerCase().includes('readme')
}

export function adaptLogseq(text) {
    // 优化logseq语法
    if (text) {
        text = text.replaceAll('^^', '==')
        text = text.replaceAll('collapsed:: true', '')
        text = text.replaceAll(/id:: [\da-z-]+/g, '')
    }
    return text
}

export function addTitle(filename, text) {
    const regx = /#{1,6} \S+/g

    if (!regx.test(text)) {
        return `# ${decodeURI(filename.slice(0, -3))} \n ${text}`
    }

    return text
}

export const foldAll = (mm) => {
    let mmDataPayload = mm?.state.data.payload;
    mmDataPayload.fold = !mmDataPayload.fold;
    mm.renderData();
    mm.fit();
}

const foldRecurs = (target) => {
    target.payload = {
        ...target.payload,
        fold: true,
    }

    target.children?.forEach((t) => {
        foldRecurs(t)
    })
}
const showLevel = (target, level) => {
    if (target.state.path.split(".").length - target.state.path.split(".").length >= level - 1) return;
    target.payload = {
        ...target.payload,
        fold: false,
    }

    target.children?.forEach((t) => {
        showLevel(t, level)
    })
}

export const handleKeyDown = (e, mm) => {
    const { key } = e
    let mmDataRoot = mm.state.data;
    if (key === ".") {
        foldRecurs(mmDataRoot)
        mm.renderData();
        mm.fit();
    } else if (key === "2") {
        showLevel(mmDataRoot, 2);
        mm.renderData();
        mm.fit();
    } else if (key === "3") {
        showLevel(mmDataRoot, 3);
        mm.renderData();
        mm.fit();
    } else if (key === "4") {
        showLevel(mmDataRoot, 4);
        mm.renderData();
        mm.fit();
    } else if (key === "5") {
        showLevel(mmDataRoot, 5);
        mm.renderData();
        mm.fit();
    } else if (key === "6") {
        showLevel(mmDataRoot, 6);
        mm.renderData();
        mm.fit();
    } else if (key === "7") {
        showLevel(mmDataRoot, 7);
        mm.renderData();
        mm.fit();
    } else if (key === "=") {
        mm.rescale(1.25);
    } else if (key === "-") {
        mm.rescale(0.8);
    } else if (key === "f" || key == 0) {
        mm.fit();
    }
}