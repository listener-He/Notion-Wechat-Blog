// utils/markdown.js
// 基于towxml的Markdown解析器，适用于小程序环境

const towxml = require('../towxml/index')
console.log('使用towxml Markdown解析器')

/**
 * 增强的Markdown解析器
 * 基于towxml库，支持完整的Markdown语法和代码高亮
 */
class EnhancedMarkdownParser {
  constructor() {
    // 使用towxml作为主要解析器
    this.useTowxml = true

    // 设置towxml配置选项
    this.towxmlOptions = {
      base: '', // 相对路径的基础路径
      theme: 'light', // 主题
      events: {
        tap: (e) => {
          console.log('towxml tap event:', e)
        }
      }
    }

    // 保留降级解析器作为备用
    this.setupFallbackRules()
  }

  // 设置降级解析规则
  setupFallbackRules() {
    this.rules = [
      // 数学公式 (LaTeX) - 块级公式
      {
        pattern: /\$\$([\s\S]+?)\$\$/g,
        replacement: (match, formula) => {
          return `<div class="math-block" data-formula="${this.escapeHtml(formula.trim())}">$$${formula.trim()}$$</div>`
        }
      },
      // 数学公式 (LaTeX) - 行内公式
      {
        pattern: /\$([^$\n\r]+)\$/g,
        replacement: (match, formula) => {
          return `<span class="math-inline" data-formula="${this.escapeHtml(formula.trim())}">$${formula.trim()}$</span>`
        }
      },

      // Mermaid图表
      {
        pattern: /```mermaid\n([\s\S]*?)```/g,
        replacement: (match, diagram) => {
          return `<div class="mermaid-diagram" data-diagram="${this.escapeHtml(diagram.trim())}">\n<pre class="mermaid">${this.escapeHtml(diagram.trim())}</pre>\n</div>`
        }
      },

      // 表格
      {
        pattern: /(\|[^\n]+\|\n)(\|[-\s:|]+\|\n)((\|[^\n]+\|\n?)+)/g,
        replacement: (match, header, separator, body) => {
          const headerCells = header.trim().split('|').filter(cell => cell.trim()).map(cell => `<th>${cell.trim()}</th>`).join('')
          const bodyRows = body.trim().split('\n').filter(row => row.trim()).map(row => {
            const cells = row.split('|').filter(cell => cell.trim()).map(cell => `<td>${cell.trim()}</td>`).join('')
            return `<tr>${cells}</tr>`
          }).join('')
          return `<table class="markdown-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`
        }
      },

      // 引用块
      {
        pattern: /^> (.+)$/gm,
        replacement: '<blockquote>$1</blockquote>'
      },
      {
        pattern: /<\/blockquote>\s*<blockquote>/g,
        replacement: '<br>'
      },

      // 代码块 (支持更多语言) - 需要在行内代码之前处理
      {
        pattern: /```([a-zA-Z0-9]*)?\s*\n([\s\S]*?)\n```/g,
        replacement: (match, lang, code) => {
          const language = lang || 'text'
          const highlightedCode = this.highlightCode(code.trim(), language)
          return `<pre class="language-${language}"><code>${highlightedCode}</code></pre>`
        }
      },

      // 行内代码 - 避免与代码块冲突
      { pattern: /`([^`\n]+)`/g, replacement: '<code class="inline-code">$1</code>' },

      // 视频 (支持常见视频平台) - 需要在图片规则之前处理
      {
        pattern: /!\[video\]\(([^)]+)\)/g,
        replacement: (match, src) => {
          if (src.includes('youtube.com') || src.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(src)
            return `<div class="video-container youtube"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`
          } else if (src.includes('bilibili.com')) {
            return `<div class="video-container bilibili"><iframe src="${src}" frameborder="0" allowfullscreen></iframe></div>`
          } else {
            return `<video class="markdown-video" controls><source src="${src}"></video>`
          }
        }
      },

      // 图片 (支持标题)
      {
        pattern: /!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]+)")?\)/g,
        replacement: (match, alt, src, title) => {
          const altAttr = alt ? ` alt="${alt}"` : ''
          const titleAttr = title ? ` title="${title}"` : ''
          return `<img src="${src}"${altAttr}${titleAttr} class="markdown-image" />`
        }
      },

      // 标题 (支持1-6级)
      { pattern: /^###### (.+)$/gm, replacement: '<h6>$1</h6>' },
      { pattern: /^##### (.+)$/gm, replacement: '<h5>$1</h5>' },
      { pattern: /^#### (.+)$/gm, replacement: '<h4>$1</h4>' },
      { pattern: /^### (.+)$/gm, replacement: '<h3>$1</h3>' },
      { pattern: /^## (.+)$/gm, replacement: '<h2>$1</h2>' },
      { pattern: /^# (.+)$/gm, replacement: '<h1>$1</h1>' },

      // 删除线
      { pattern: /~~(.+?)~~/g, replacement: '<del>$1</del>' },

      // 粗体和斜体
      { pattern: /\*\*\*(.+?)\*\*\*/g, replacement: '<strong><em>$1</em></strong>' },
      { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
      { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },

      // 链接
      {
        pattern: /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]+)")?\)/g,
        replacement: (match, text, href, title) => {
          const titleAttr = title ? ` title="${title}"` : ''
          return `<a href="${href}"${titleAttr}>${text}</a>`
        }
      },

      // 无序列表
      {
        pattern: /(^[*+-] .+$\n?)+/gm,
        replacement: (match) => {
          const items = match.trim().split('\n').map(line => {
            const content = line.replace(/^[*+-] /, '')
            return `<li>${content}</li>`
          }).join('')
          return `<ul>${items}</ul>`
        }
      },

      // 有序列表
      {
        pattern: /(^\d+\. .+$\n?)+/gm,
        replacement: (match) => {
          const items = match.trim().split('\n').map(line => {
            const content = line.replace(/^\d+\. /, '')
            return `<li>${content}</li>`
          }).join('')
          return `<ol>${items}</ol>`
        }
      },

      // 水平分割线
      { pattern: /^---$/gm, replacement: '<hr>' },
      { pattern: /^\*\*\*$/gm, replacement: '<hr>' },

      // 换行处理
      { pattern: /\n\n/g, replacement: '</p><p>' },
      { pattern: /\n/g, replacement: '<br>' }
    ]
  }

  // 提取YouTube视频ID
  extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // 增强的代码语法高亮
  highlightCode(code, language) {
    if (!code) return ''

    // 转义HTML字符
    code = code.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

    // 根据语言进行语法高亮
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
      case 'jsx':
        return this.highlightJavaScript(code)
      case 'typescript':
      case 'ts':
      case 'tsx':
        return this.highlightTypeScript(code)
      case 'python':
      case 'py':
        return this.highlightPython(code)
      case 'java':
        return this.highlightJava(code)
      case 'c':
      case 'cpp':
      case 'c++':
        return this.highlightC(code)
      case 'csharp':
      case 'cs':
        return this.highlightCSharp(code)
      case 'php':
        return this.highlightPHP(code)
      case 'ruby':
      case 'rb':
        return this.highlightRuby(code)
      case 'go':
        return this.highlightGo(code)
      case 'rust':
      case 'rs':
        return this.highlightRust(code)
      case 'swift':
        return this.highlightSwift(code)
      case 'kotlin':
      case 'kt':
        return this.highlightKotlin(code)
      case 'css':
      case 'scss':
      case 'sass':
      case 'less':
        return this.highlightCSS(code)
      case 'html':
      case 'xml':
        return this.highlightHTML(code)
      case 'json':
        return this.highlightJSON(code)
      case 'yaml':
      case 'yml':
        return this.highlightYAML(code)
      case 'markdown':
      case 'md':
        return this.highlightMarkdown(code)
      case 'sql':
        return this.highlightSQL(code)
      case 'bash':
      case 'shell':
      case 'sh':
        return this.highlightBash(code)
      case 'dockerfile':
        return this.highlightDockerfile(code)
      default:
        return code
    }
  }

  // JavaScript语法高亮
  highlightJavaScript(code) {
    return code
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|finally)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null|undefined)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // Python语法高亮
  highlightPython(code) {
    return code
      .replace(/\b(def|class|import|from|if|elif|else|for|while|try|except|finally|with|as|return|yield|lambda|pass|break|continue|and|or|not|in|is)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(True|False|None)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/(['"`])([^\1]*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
  }

  // CSS语法高亮
  highlightCSS(code) {
    return code
      .replace(/([.#]?[a-zA-Z][a-zA-Z0-9-_]*)(\s*{)/g, '<span class="selector">$1</span>$2')
      .replace(/([a-zA-Z-]+)(\s*:)/g, '<span class="property">$1</span>$2')
      .replace(/:\s*([^;]+);/g, ': <span class="value">$1</span>;')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // HTML语法高亮
  highlightHTML(code) {
    return code
      .replace(/(&lt;\/?)(\w+)([^&gt;]*?)(&gt;)/g, '$1<span class="tag">$2</span><span class="attr">$3</span>$4')
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>')
  }

  // JSON语法高亮
  highlightJSON(code) {
    return code
      .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
      .replace(/:\s*"([^"]*)"/g, ': <span class="string">"$1"</span>')
      .replace(/:\s*(true|false|null)/g, ': <span class="literal">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="number">$1</span>')
  }

  // TypeScript语法高亮
  highlightTypeScript(code) {
    return code
      .replace(/\b(interface|type|enum|namespace|declare|abstract|readonly|private|protected|public|static|extends|implements|keyof|typeof|as|is|in|const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|finally)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(string|number|boolean|object|any|void|never|unknown|undefined|null|true|false)\b/g, '<span class="type">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // Java语法高亮
  highlightJava(code) {
    return code
      .replace(/\b(public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp|class|interface|enum|extends|implements|package|import|throws|throw|try|catch|finally|if|else|for|while|do|switch|case|default|break|continue|return|new|this|super|instanceof|void|int|long|short|byte|char|float|double|boolean|String)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+[lLfFdD]?\b/g, '<span class="number">$1</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/&#39;([^&#39;])&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // C/C++语法高亮
  highlightC(code) {
    return code
      .replace(/\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|bool|true|false|nullptr|class|private|public|protected|virtual|override|final|namespace|using|template|typename|new|delete|this|try|catch|throw)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(NULL|TRUE|FALSE)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+[ulULfF]*\b/g, '<span class="number">$1</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/&#39;([^&#39;])&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
      .replace(/#\w+/g, '<span class="preprocessor">$&</span>')
  }

  // C#语法高亮
  highlightCSharp(code) {
    return code
      .replace(/\b(abstract|as|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|var|async|await)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|null)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+[ulULfFdDmM]*\b/g, '<span class="number">$1</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/&#39;([^&#39;])&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // PHP语法高亮
  highlightPHP(code) {
    return code
      .replace(/\b(abstract|and|array|as|break|callable|case|catch|class|clone|const|continue|declare|default|die|do|echo|else|elseif|empty|enddeclare|endfor|endforeach|endif|endswitch|endwhile|eval|exit|extends|final|finally|for|foreach|function|global|goto|if|implements|include|include_once|instanceof|insteadof|interface|isset|list|namespace|new|or|print|private|protected|public|require|require_once|return|static|switch|throw|trait|try|unset|use|var|while|xor|yield|true|false|null)\b/g, '<span class="keyword">$1</span>')
      .replace(/\$\w+/g, '<span class="variable">$&</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
  }

  // Ruby语法高亮
  highlightRuby(code) {
    return code
      .replace(/\b(alias|and|begin|break|case|class|def|defined|do|else|elsif|end|ensure|false|for|if|in|module|next|nil|not|or|redo|rescue|retry|return|self|super|then|true|undef|unless|until|when|while|yield|require|include|extend|attr_reader|attr_writer|attr_accessor|private|protected|public)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(true|false|nil)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/:[a-zA-Z_]\w*/g, '<span class="symbol">$&</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
  }

  // Go语法高亮
  highlightGo(code) {
    return code
      .replace(/\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go|goto|if|import|interface|map|package|range|return|select|struct|switch|type|var|true|false|nil|iota)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(bool|byte|complex64|complex128|error|float32|float64|int|int8|int16|int32|int64|rune|string|uint|uint8|uint16|uint32|uint64|uintptr)\b/g, '<span class="type">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // Rust语法高亮
  highlightRust(code) {
    return code
      .replace(/\b(as|break|const|continue|crate|else|enum|extern|false|fn|for|if|impl|in|let|loop|match|mod|move|mut|pub|ref|return|self|Self|static|struct|super|trait|true|type|unsafe|use|where|while|async|await|dyn)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(bool|char|str|i8|i16|i32|i64|i128|isize|u8|u16|u32|u64|u128|usize|f32|f64|String|Vec|Option|Result)\b/g, '<span class="type">$1</span>')
      .replace(/\b(true|false|None|Some|Ok|Err)\b/g, '<span class="literal">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // Swift语法高亮
  highlightSwift(code) {
    return code
      .replace(/\b(associatedtype|class|deinit|enum|extension|fileprivate|func|import|init|inout|internal|let|open|operator|private|protocol|public|static|struct|subscript|typealias|var|break|case|continue|default|defer|do|else|fallthrough|for|guard|if|in|repeat|return|switch|where|while|as|catch|false|is|nil|rethrows|super|self|Self|throw|throws|true|try|async|await)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(Any|AnyObject|Bool|Character|Double|Float|Int|String|Void|true|false|nil)\b/g, '<span class="type">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // Kotlin语法高亮
  highlightKotlin(code) {
    return code
      .replace(/\b(abstract|actual|annotation|as|break|by|catch|class|companion|const|constructor|continue|crossinline|data|do|dynamic|else|enum|expect|external|false|final|finally|for|fun|get|if|import|in|infix|init|inline|inner|interface|internal|is|lateinit|noinline|null|object|open|operator|out|override|package|private|protected|public|reified|return|sealed|set|super|suspend|tailrec|this|throw|true|try|typealias|typeof|val|var|vararg|when|where|while)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(Any|Boolean|Byte|Char|Double|Float|Int|Long|Nothing|Short|String|Unit|true|false|null)\b/g, '<span class="type">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // YAML语法高亮
  highlightYAML(code) {
    return code
      .replace(/^([a-zA-Z_][\w-]*):(?=\s|$)/gm, '<span class="key">$1</span>:')
      .replace(/:\s*(true|false|null|~)$/gm, ': <span class="literal">$1</span>')
      .replace(/:\s*(\d+)$/gm, ': <span class="number">$1</span>')
      .replace(/:\s*&quot;([^&quot;]*)&quot;/g, ': <span class="string">&quot;$1&quot;</span>')
      .replace(/:\s*&#39;([^&#39;]*)&#39;/g, ': <span class="string">&#39;$1&#39;</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
      .replace(/^---$/gm, '<span class="separator">$&</span>')
      .replace(/^\.\.\.$/, '<span class="separator">$&</span>')
  }

  // Markdown语法高亮
  highlightMarkdown(code) {
    return code
      .replace(/^(#{1,6})\s+(.+)$/gm, '<span class="header">$1</span> <span class="header-text">$2</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<span class="bold">**$1**</span>')
      .replace(/\*([^*]+)\*/g, '<span class="italic">*$1*</span>')
      .replace(/`([^`]+)`/g, '<span class="code">`$1`</span>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="link">[</span><span class="link-text">$1</span><span class="link">](</span><span class="url">$2</span><span class="link">)</span>')
      .replace(/^>\s+(.+)$/gm, '<span class="quote">&gt; $1</span>')
      .replace(/^[-*+]\s+(.+)$/gm, '<span class="list">- $1</span>')
      .replace(/^\d+\.\s+(.+)$/gm, '<span class="list">1. $1</span>')
  }

  // SQL语法高亮
  highlightSQL(code) {
    return code
      .replace(/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TABLE|INDEX|VIEW|DATABASE|SCHEMA|GRANT|REVOKE|COMMIT|ROLLBACK|TRANSACTION|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|GROUP|BY|ORDER|HAVING|DISTINCT|UNION|ALL|AS|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|TRUE|FALSE|CASE|WHEN|THEN|ELSE|END|IF|WHILE|FOR|DECLARE|SET|EXEC|EXECUTE|PROCEDURE|FUNCTION|TRIGGER|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|CHECK|DEFAULT|AUTO_INCREMENT|IDENTITY)\b/gi, '<span class="keyword">$1</span>')
      .replace(/\b(INT|INTEGER|BIGINT|SMALLINT|TINYINT|DECIMAL|NUMERIC|FLOAT|REAL|DOUBLE|CHAR|VARCHAR|TEXT|NCHAR|NVARCHAR|NTEXT|DATE|TIME|DATETIME|TIMESTAMP|YEAR|BINARY|VARBINARY|BLOB|CLOB|BOOLEAN|BIT)\b/gi, '<span class="type">$1</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/--.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }

  // Bash语法高亮
  highlightBash(code) {
    return code
      .replace(/\b(if|then|else|elif|fi|case|esac|for|while|until|do|done|function|return|break|continue|exit|export|source|alias|unalias|cd|pwd|ls|cp|mv|rm|mkdir|rmdir|chmod|chown|grep|sed|awk|sort|uniq|head|tail|cat|less|more|find|xargs|tar|gzip|gunzip|zip|unzip|curl|wget|ssh|scp|rsync|ps|top|kill|killall|jobs|bg|fg|nohup|screen|tmux|crontab|sudo|su|whoami|id|groups|passwd|useradd|userdel|usermod|groupadd|groupdel|mount|umount|df|du|free|uptime|uname|date|cal|history|which|whereis|locate|man|info|help|echo|printf|read|test|true|false)\b/g, '<span class="keyword">$1</span>')
      .replace(/\$\w+/g, '<span class="variable">$&</span>')
      .replace(/\$\{[^}]+\}/g, '<span class="variable">$&</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
      .replace(/^\s*#!.*$/gm, '<span class="shebang">$&</span>')
  }

  // Dockerfile语法高亮
  highlightDockerfile(code) {
    return code
      .replace(/^\s*(FROM|RUN|CMD|LABEL|MAINTAINER|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/gm, '<span class="keyword">$1</span>')
      .replace(/\$\w+/g, '<span class="variable">$&</span>')
      .replace(/\$\{[^}]+\}/g, '<span class="variable">$&</span>')
      .replace(/\b\d+\b/g, '<span class="number">$1</span>')
      .replace(/&#39;([^&#39;]*)&#39;/g, '<span class="string">&#39;$1&#39;</span>')
      .replace(/&quot;([^&quot;]*)&quot;/g, '<span class="string">&quot;$1&quot;</span>')
      .replace(/#.*$/gm, '<span class="comment">$&</span>')
  }

  /**
   * 解析Markdown文本为HTML
   * @param {string} markdown - Markdown文本
   * @returns {string} HTML文本
   */
  parse(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return ''
    }

    if (this.useTowxml) {
      try {
        // 使用towxml解析Markdown
        const result = towxml(markdown, 'markdown', this.towxmlOptions)
        return result
      } catch (error) {
        console.error('towxml解析错误:', error)
        // 降级到规则解析器
        return this.fallbackParseWithRules(markdown)
      }
    } else {
      // 使用降级解析器
      return this.fallbackParseWithRules(markdown)
    }
  }

  /**
   * 使用规则的降级解析方法
   * @param {string} markdown - Markdown文本
   * @returns {string} HTML文本
   */
  fallbackParseWithRules(markdown) {
    let html = markdown

    // 应用所有规则
    this.rules.forEach(rule => {
      if (typeof rule.replacement === 'function') {
        html = html.replace(rule.pattern, rule.replacement.bind(this))
      } else {
        html = html.replace(rule.pattern, rule.replacement)
      }
    })

    // 包装在段落标签中
    html = `<p>${html}</p>`

    // 清理多余的空段落和修复嵌套问题
    html = html.replace(/<p><\/p>/g, '')
    html = html.replace(/<p>\s*<\/p>/g, '')
    html = html.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1')
    html = html.replace(/<p>(<table[\s\S]*?<\/table>)<\/p>/g, '$1')
    html = html.replace(/<p>(<div[\s\S]*?<\/div>)<\/p>/g, '$1')
    html = html.replace(/<p>(<pre[\s\S]*?<\/pre>)<\/p>/g, '$1')
    html = html.replace(/<p>(<blockquote>.*?<\/blockquote>)<\/p>/g, '$1')
    html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1')
    html = html.replace(/<p>(<ol>.*?<\/ol>)<\/p>/g, '$1')

    return html
  }

  /**
   * 降级解析方法（当marked解析失败时使用）
   * @param {string} markdown - Markdown文本
   * @returns {string} HTML文本
   */
  fallbackParse(markdown) {
    return markdown
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
  }

  /**
   * HTML转义
   * @param {string} text - 需要转义的文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#39;'
    }
    return text.replace(/[&<>"']/g, (m) => map[m])
  }
}

// 创建解析器实例
const md = new EnhancedMarkdownParser()

/**
 * 将Markdown文本转换为适合rich-text组件的HTML
 * @param {string} markdown - Markdown文本
 * @returns {string} - 处理后的HTML字符串
 */
function parseMarkdown(markdown) {
  if (!markdown) return ''

  try {
    // 将Markdown转换为HTML
    let html = md.parse(markdown)

    // 处理HTML以适配小程序rich-text组件
    html = processHtmlForRichText(html)

    return html
  } catch (error) {
    console.error('Markdown解析失败:', error)
    return markdown // 解析失败时返回原始文本
  }
}

/**
 * 处理HTML以适配小程序rich-text组件
 * @param {string} html - 原始HTML
 * @returns {string} - 处理后的HTML
 */
function processHtmlForRichText(html) {
  if (!html) return ''

  return html
    // 移除不支持的标签和属性
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // 移除script标签
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // 移除style标签
    .replace(/style="[^"]*"/gi, '') // 移除内联样式
    .replace(/class="[^"]*"/gi, '') // 移除class属性
    .replace(/id="[^"]*"/gi, '') // 移除id属性
    .replace(/onclick="[^"]*"/gi, '') // 移除onclick事件
    .replace(/javascript:[^"']*/gi, '') // 移除javascript链接
    // 处理图片标签，确保使用网络图片
    .replace(/<img([^>]*?)src="([^"]*?)"([^>]*?)>/gi, (match, before, src, after) => {
      // 如果是相对路径，转换为绝对路径
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        // 这里可以根据实际情况设置图片的base URL
        const baseUrl = 'https://blog.hehouhui.cn' // 替换为实际的域名
        src = src.startsWith('/') ? baseUrl + src : baseUrl + '/' + src
      }
      return `<img${before}src="${src}"${after}>`
    })
    // 处理链接，移除target属性（小程序不支持）
    .replace(/target="[^"]*"/gi, '')
    // 清理多余的空格
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 估算阅读时间
 * @param {string} text - 文本内容
 * @param {number} wordsPerMinute - 每分钟阅读字数，默认300
 * @returns {number} - 预估阅读时间（分钟）
 */
function estimateReadingTime(text, wordsPerMinute = 300) {
  if (!text) return 0

  const wordCount = text.length
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute))
}

module.exports = {
  parseMarkdown,
  processHtmlForRichText,
  estimateReadingTime
}
