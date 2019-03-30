import React from 'react'
import ReactDOM from 'react-dom'
import BraftEditor from '../src'
import ColorPicker from 'braft-extensions/dist/color-picker'
import Emoticon, { defaultEmoticons } from 'braft-extensions/dist/emoticon'
import { ContentUtils } from 'braft-utils'

import 'braft-extensions/dist/emoticon.css'
import 'braft-extensions/dist/color-picker.css'

const emoticons = defaultEmoticons.map((item) =>
  require(`braft-extensions/dist/assets/${item}`),
)

import loadMathJax from '../mathjax/mathjax/loadMathJax'
import { myKeyBindingFn, findInlineTeXEntities } from '../mathjax/utils'
import insertTeX from '../mathjax/modifiers/insertTeX'
import InlineTeX from '../mathjax/components/InlineTeX'
import initCompletion from '../mathjax/mathjax/completion'
import TeXBlock from '../mathjax/components/TeXBlock'

const defaultConfig = {
  macros: {},
  completion: 'auto',
}

loadMathJax(defaultConfig)

const store = {
  getEditorState: undefined,
  setEditorState: undefined,
  getReadOnly: undefined,
  setReadOnly: undefined,
  getEditorRef: undefined,
  completion: initCompletion(defaultConfig.completion, defaultConfig.macros),
  teXToUpdate: {},
}

let initFisrtCompletion = false

const mathjaxExtension = [
  {
    type: 'decorator',
    // includeEditors, excludeEditors,
    decorator: {
      strategy: findInlineTeXEntities,
      component: InlineTeX,
      props: {
        getStore: () => store,
      },
    },
  },
  {
    type: 'block',
    name: 'blockTex',
    rendererFn: (block) => {
      return {
        component: TeXBlock,
        editable: false,
        props: { getStore: () => store },
      }
    },
  },
  {
    type: 'prop-interception',
    interceptor: (editorProps, editor) => {
      if (!editor.store) {
        store.getEditorState = () => editor.state.editorState
        store.setEditorState = (editorState) => {
          editor.props.onChange(editorState)
        }
        store.getReadOnly = editorProps.getReadOnly
        store.setReadOnly = editorProps.setReadOnly
        store.getEditorRef = () => editor.editor
        editor.store = store
      }
      if (
        editor.state !== undefined &&
        typeof store.completion === 'function'
      ) {
        store.completion = store.completion(editor.state.editorState)
      }
      return editorProps
    },
  },
]

const _insertTeX = (block = false) => {
  const originEditorState = store.getEditorState()
  const editorState = insertTeX(originEditorState, block)
  // editorState.convertOptions = originEditorState.convertOptions
  store.setEditorState(editorState)
}

const handleKeyCommand = (
  command /* ,{ getEditorState, setEditorState } */,
) => {
  if (command === 'insert-inlinetex') {
    _insertTeX()
    return 'handled'
  }
  if (command === 'insert-texblock') {
    _insertTeX(true)
    return 'handled'
  }
  return 'not-handled'
}

BraftEditor.use(mathjaxExtension)

class Demo extends React.Component {
  constructor(props) {
    super(props)

    const editorState = BraftEditor.createEditorState(
      JSON.parse(
        '{"blocks":[{"key":"darpv","text":" \\t\\t ","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[{"offset":1,"length":2,"key":0}],"data":{}}],"entityMap":{"0":{"type":"INLINETEX","mutability":"IMMUTABLE","data":{"teX":"aasdfasdf","displaystyle":false}}}}',
      ),
    )
    const keyBindingFn = myKeyBindingFn(() => {
      return this.state.editorState
    })

    this.state = {
      count: 0,
      readOnly: false,
      editorState,
      keyBindingFn,
    }
  }

  handleChange = (editorState) => {
    this.setState({ editorState })
  }

  logHTML = () => {
    console.log(this.state.editorState.toRAW())
    console.log(this.state.editorState.toHTML())
  }

  setReadOnly = (readOnly) => {
    this.setState({
      readOnly,
    })
  }

  getReadOnly = () => {
    this.state.readOnly
  }

  render() {
    const { readOnly, editorState } = this.state

    // const controls = [
    //   'bold',
    //   'italic',
    //   'underline',
    //   'strike-through',
    //   'text-color',
    // ]

    return (
      <div>
        <div className="demo" id="demo">
          <BraftEditor
            ref={(element) => {
              this.editor = element
            }}
            handleKeyCommand={handleKeyCommand}
            keyBindingFn={this.state.keyBindingFn}
            // controls={controls}
            extendControls={[
              {
                key: 'log-html',
                type: 'button',
                text: 'Log HTML',
                onClick: this.logHTML,
              },
              {
                key: 'my-modal',
                type: 'modal',
                text: 'modal',
                modal: {
                  id: 'a',
                  closeOnBlur: true,
                  confirmable: true,
                  closeOnConfirm: false,
                  component: <div>123123</div>,
                },
              },
            ]}
            media={{
              items: [
                {
                  id: 'embed_1',
                  type: 'EMBED',
                  name: '优酷视频',
                  meta: {
                    poster:
                      'https://margox.cn/wp-content/uploads/2018/09/IMG_9508.jpg',
                  },
                  url:
                    '<embed src=\'http://player.youku.com/player.php/sid/XNDAwNDIxODg4OA==/v.swf\' allowFullScreen=\'true\' quality=\'high\' width=\'480\' height=\'400\' align=\'middle\' allowScriptAccess=\'always\' type=\'application/x-shockwave-flash\'></embed>',
                },
                {
                  id: 'audio_1',
                  type: 'AUDIO',
                  name: '才华有限公司',
                  url:
                    'http://cloudary-1253638848.cossh.myqcloud.com/%E9%87%91%E7%8E%9F%E5%B2%90%20-%20%E6%89%8D%E5%8D%8E%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.mp3',
                },
              ],
            }}
            triggerChangeOnMount={false}
            value={editorState}
            onChange={this.handleChange}
            readOnly={readOnly}
            getReadOnly={this.getReadOnly}
            setReadOnly={this.setReadOnly}
          />
        </div>
      </div>
    )
  }
}

ReactDOM.render(<Demo />, document.querySelector('#root'))
