import React, { useRef, useEffect } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Toolbar } from 'markmap-toolbar';
import { adaptLogseq, hideAll, showLevel, toggleFullScreen, initMarkmapOptions, copyLink, unfoldRecurs, foldRecurs } from '../utils';
import { useNotification } from './NotificationContext';

const transformer = new Transformer();

function renderToolbar(mm, wrapper) {
    while (wrapper?.firstChild) wrapper.firstChild.remove();
    if (mm && wrapper) {
        const toolbar = new Toolbar();
        toolbar.showBrand = false
        toolbar.attach(mm);
        toolbar.registry.fit.title = '适应窗口'
        // Register custom buttons
        toolbar.register({
            id: 'edit',
            title: '编辑',
            content: '✍',
            onClick: () => window.open(`${import.meta.env.VITE_SERVER_URL}/markmap${location.pathname.replace("/@markmap", "")}`),
        });

        toolbar.register({
            id: 'full',
            title: '全屏',
            content: '⭕',
            onClick: () => toggleFullScreen(),
        });

        toolbar.register({
            id: 'copyLink',
            title: '复制链接',
            content: '🔗',
            onClick: () => {
                copyLink()
                mm.showNotification("已复制")
            },
        });

        toolbar.registry.recurse = {
            ...toolbar.registry.recurse,
            title: '折叠/展开',
            onClick: () => hideAll(mm)
        }
        // console.log( Toolbar.defaultItems);
        toolbar.setItems([...Toolbar.defaultItems, 'full', 'edit', 'copyLink']);
        wrapper.append(toolbar.render());
    }
}

const MarkmapHooks = React.memo((props) => {
    // Ref for SVG element
    const refSvg = useRef();
    // Ref for markmap object
    const refMm = useRef();
    // Ref for toolbar wrapper
    const refToolbar = useRef();
    const showNotification = useNotification();
    useEffect(() => {
        // Create markmap and save to refMm
        const mm = Markmap.create(refSvg.current);
        mm.showNotification = showNotification
        refMm.current = mm;
        renderToolbar(refMm.current, refToolbar.current);

    }, [props]);

    useEffect(() => {
        const mm = refMm.current;
        if (!mm) return;
        const { root } = transformer.transform(adaptLogseq(props.text));
        initMarkmapOptions(mm, root)
        mm.setData(root);
        mm.renderData();
        mm.fit();
        // 组件挂载时添加事件监听器
        window.addEventListener('keydown', handleKeyDown);

        // 组件卸载时移除事件监听器
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            mm.destroy()
        };
    }, [props]);

    const handleKeyDown = ({ key }) => {
        // console.log('key:', key);
        const mm = refMm.current;

        let mmDataRoot = mm.state.data;

        switch (key) {
            case ",":
                unfoldRecurs(mmDataRoot);
                break;
            case "1":
            case ".":
                foldRecurs(mmDataRoot);
                break;
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
                foldRecurs(mmDataRoot);
                showLevel(mmDataRoot, parseInt(key));
                break;
            case "=":
            case "+":
                mm.rescale(1.25);
                return;
            case "-":
                mm.rescale(0.8);

                return;
            case '9':
                hideAll(mm);
                return;
            case "0":
            case "space":
                mm.fit();
                break;
            default:
                // Handle default case if needed
                break;
        }

        mm.renderData();
        mm.fit();
    }

    return (
        <React.Fragment>
            <svg className="flex-1" ref={refSvg} />
            <div className="absolute bottom-1 left-1 cursor-pointer" ref={refToolbar}></div>
        </React.Fragment>
    );
})

MarkmapHooks.displayName = 'MarkmapHooks';
export default MarkmapHooks;