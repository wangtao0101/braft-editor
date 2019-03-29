import React from 'react'
import ReactDOM from 'react-dom'
import BraftEditor from '../src'
import ColorPicker from 'braft-extensions/dist/color-picker'
import Emoticon, { defaultEmoticons } from 'braft-extensions/dist/emoticon'
import { ContentUtils } from 'braft-utils'

import 'braft-extensions/dist/emoticon.css'
import 'braft-extensions/dist/color-picker.css'

const emoticons = defaultEmoticons.map(item => require(`braft-extensions/dist/assets/${item}`))

import loadMathJax from '../mathjax/mathjax/loadMathJax'
import { myKeyBindingFn, findInlineTeXEntities } from '../mathjax/utils';
import insertTeX from '../mathjax/modifiers/insertTeX';
import InlineTeX from '../mathjax/components/InlineTeX';
import initCompletion from '../mathjax/mathjax/completion'

const defaultConfig = {
  macros: {},
  completion: 'auto',
}

loadMathJax(defaultConfig);

const store = {
  getEditorState: undefined,
  setEditorState: undefined,
  getReadOnly: undefined,
  setReadOnly: undefined,
  getEditorRef: undefined,
  completion: initCompletion(defaultConfig.completion, defaultConfig.macros),
  teXToUpdate: {},
}

// 编写扩展模块
const underdotExtension = [{
  // 指定扩展类型
  type: 'inline-style',
  // 指定该扩展对哪些编辑器生效，不指定includeEditors则对所有编辑器生效
  // includeEditors: [],
  // 指定扩展样式名，推荐使用全大写
  name: 'UNDERDOT',
  // 在编辑器工具栏中增加一个样式控制按钮，text可以为一个react组件
  control: {
    text: '着重号'
  },
  // 指定该扩展样式的CSS规则，请注意，IE/EDGE浏览器暂时不支持textEmphasis
  style: {
    textEmphasis: 'circle',
    textEmphasisPosition: 'under',
    WebkitTextEmphasis: 'circle',
    WebkitTextEmphasisPosition: 'under'
  },
  importer: (nodeName, node) => {
    // 指定html转换为editorState时，何种规则的内容将会附加上该扩展样式
    // 如果编辑器在createEditorState时使用的是RAW数据，并且开启了stripPastedStyles，则可以不指定importer，因为不存在html转editorState的场景
    return nodeName === 'span' && [].find.call(node.style, (styleName) => styleName.indexOf('text-emphasis') !== -1)
  },
  exporter: () => {
    // 指定该样式在输出的html中如何呈现，对于inline-style类型的扩展可以不指定exporter，输出样式即为该扩展的style
    return (
      <span style={{
        textEmphasis: 'circle',
        textEmphasisPosition: 'under',
        WebkitTextEmphasis: 'circle',
        WebkitTextEmphasisPosition: 'under'
      }} />
    )
  }
},{
  type: 'decorator',
  // includeEditors, excludeEditors,
  decorator: {
    strategy: findInlineTeXEntities,
    component: InlineTeX,
    props: {
      getStore: () => store,
    }
  }
}]



// BraftEditor.use([
//   Emoticon({
//     emoticons: emoticons
//   }),
//   ColorPicker({
//     theme: 'dark'
//   })
// ])

BraftEditor.use(underdotExtension)

class Demo extends React.Component {

  constructor(props) {

    super(props)

    const editorState =  BraftEditor.createEditorState(null);
    const keyBindingFn = myKeyBindingFn(() => {
      return this.state.editorState;
    })

    store.getEditorState = () => this.state.editorState;
    store.setEditorState = (editorState) => {
      this.setState({
        editorState,
      })
    }
    store.getReadOnly = () => {}
    store.setReadOnly = () => {}
    store.getEditorRef = () => this.editor;
    store.completion = store.completion(editorState)

    this.state = {
      count: 0,
      readOnly: false,
      editorState,
      keyBindingFn,
    }

  }

  _insertTeX = (block = false) => {
    this.setState({
      editorState: insertTeX(this.state.editorState, block),
    })
  }

  handleKeyCommand = (command /* ,{ getEditorState, setEditorState } */) => {
    if (command === 'insert-inlinetex') {
      this._insertTeX()
      return 'handled'
    }
    return 'not-handled'
  }

  handleChange = (editorState) => {
    this.setState({ editorState })
  }

  logHTML = () => {
    console.log(this.state.editorState.toHTML())
  }

  render() {

    const { readOnly, editorState } = this.state

    const controls = ['bold', 'italic', 'underline', 'strike-through', 'text-color']

    return (
      <div>
        <div className="demo" id="demo">
          <BraftEditor
            ref={(element) => { this.editor = element; }}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.state.keyBindingFn}
            controls={controls}
            extendControls={[{
              key: 'log-html',
              type: 'button',
              text: 'Log HTML',
              onClick: this.logHTML,
            }, {
              key: 'my-modal',
              type: 'modal',
              text: 'modal',
              modal: {
                id: 'a',
                closeOnBlur: true,
                confirmable: true,
                closeOnConfirm: false,
                component: <div>123123</div>
              }
            }]}
            media={{
              items: [
                {
                  id: 'embed_1',
                  type: 'EMBED',
                  name: '优酷视频',
                  meta: {
                    poster: 'https://margox.cn/wp-content/uploads/2018/09/IMG_9508.jpg'
                  },
                  url: `<embed src='http://player.youku.com/player.php/sid/XNDAwNDIxODg4OA==/v.swf' allowFullScreen='true' quality='high' width='480' height='400' align='middle' allowScriptAccess='always' type='application/x-shockwave-flash'></embed>`
                }, {
                  id: 'audio_1',
                  type: 'AUDIO',
                  name: '才华有限公司',
                  url: 'http://cloudary-1253638848.cossh.myqcloud.com/%E9%87%91%E7%8E%9F%E5%B2%90%20-%20%E6%89%8D%E5%8D%8E%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.mp3'
                }
              ]
            }}
            triggerChangeOnMount={false}
            value={editorState}
            onChange={this.handleChange}
            readOnly={readOnly}
          />
        </div>
      </div>
    )

  }

}

ReactDOM.render(<Demo />, document.querySelector('#root'))