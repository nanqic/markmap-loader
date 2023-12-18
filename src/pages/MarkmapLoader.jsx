
import React, { useEffect, useState } from 'react'
import MarkmapHooks from './MarkmapHooks'
import { postRequest, textRequest, useSyncCallback } from '../utils'

export default function MarkmapLoader() {
  const [users, setUsers] = useState()
  const [currentuser, setCurrentuser] = useState()
  const [currentmark, setCurrentmark] = useState()
  const [marks, setMarks] = useState()
  const [subdirs, setSubdirs] = useState([])
  const [text, setText] = useState()
  const src_host = 'https://box.hdcxb.net'
  useEffect(() => {

    initData()
  }, [])

  const syncLoadMarklist = useSyncCallback(() => {
    loadMarklist(currentuser)
    if (currentmark)
      handleClick(currentmark)
  });

  const initData = async () => {
    const dirsUrl = `${src_host}/api/fs/dirs?path=markmap`
    const resp = await postRequest(dirsUrl)

    const userArr = []
    resp.data.forEach(item => {
      userArr.push(item.name)
    })
    setUsers(userArr)
    let user01 = userArr[0]
    // 如果有传hash，读取user和markmap
    if (location.hash) {
      let hash = location.hash.slice(1).split('/')
      setCurrentuser(hash[0])
      setCurrentmark(hash.slice(1).join('/'))
      syncLoadMarklist()

    } else {
      setCurrentuser(user01)
      loadMarklist(user01)
    }
  }

  async function loadMarklist(user) {
    const listUrl = `${src_host}/api/fs/list?path=markmap`
    const userFiles = (await postRequest(`${listUrl}/${user}`))?.data?.content
    const markArr = []
    userFiles.forEach(async file => {
      if (file.is_dir) {
        postRequest(`${listUrl}/${user}`)
        const userFiles2 = (await postRequest(`${listUrl}/${user}/${file.name}`))?.data?.content
        const markArr2 = []
        userFiles2.forEach(file2 => {
          if (file2.name.indexOf('.md') != -1) {
            markArr2.push(file2.name)
          }
        })
        setSubdirs([...subdirs, { name: file.name, files: markArr2 }])
      }

      if (file.name.indexOf('.md') != -1) {
        markArr.push(file.name)
      }
    })
    setMarks(markArr)
  }

  const handleClick = async (filename) => {
    const fileUrl = `${src_host}/d/markmap/${currentuser}/${filename}`
    let text = await textRequest(fileUrl)
    const regx = /#{1,6} \S+/g

    setCurrentmark(filename)
    // 优化logseq语法
    if (text) {
      text = text.replaceAll('^^', '==')
      text = text.replaceAll('collapsed:: true', '')
      text = text.replaceAll(/id:: [\da-z-]+/g, '')

      // 自动折叠节点
      if (regx.test(text)) {
        text = text.replaceAll(regx, "$& <!-- fold recursively -->")
      } else {
        text = `# ${decodeURI(filename?.replace('.md', ''))} <!-- fold recursively -->\n` + text
      }

    }

    setText(text)
  }

  const handleChange = (e) => {
    location.hash = `#${e.target.value}`
    setText()
    setCurrentuser(e.target.value)
    loadMarklist(e.target.value);
  }
  return (
    <>
      <div className="absolute top-1 left-1">

        <details open>
          <summary>
            <select onChange={handleChange} value={currentuser} >
              {
                users?.map(user => {
                  return <option key={user} value={user}>{user}</option>
                })
              }
            </select>
            <a href="/" target='_self'> 主页</a>
          </summary>
          {
            subdirs.map(dir => {
              return (
                <details key={dir.name}>
                  <summary>
                    <strong> {dir.name}</strong>
                  </summary>
                  {dir.files.map(file => {
                    return <li key={file} className='subdir'>
                      <a href={`#${currentuser}/${dir.name}/${file}`} onClick={() => handleClick(`${dir.name}/${file}`)}>{file}</a>
                    </li>
                  })}
                </details>
              )
            })
          }
          {
            marks?.map(mark => {
              return <li key={mark} className={mark == currentmark ? 'under-1' : ''}><a href={`#${currentuser}/${mark}`} onClick={() => handleClick(mark)}>{mark}</a></li>
            })
          }
        </details>

      </div>

      {text &&
        <div className="flex flex-col h-screen p-2">
          <MarkmapHooks text={text} editUrl={`${src_host}/markmap/${currentuser}/${currentmark}`} />
        </div>
      }
    </>
  )
}
