import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Play, FileText, Code, Database } from 'lucide-react';

const SlideEditor = () => {
  const [currentFormat, setCurrentFormat] = useState('markdown');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // 不同格式的範例內容
  const [contents, setContents] = useState({
    markdown: `# 歡迎使用 Markdown 投影片
## 這是副標題

這是第一張投影片的內容。

- 支援列表
- **粗體文字**
- *斜體文字*
- [連結](https://example.com)

---

# 第二張投影片
## 功能特色

\`\`\`javascript
// 支援程式碼區塊
function hello() {
  console.log("Hello World!");
}
\`\`\`

> 這是引用區塊

---

# 第三張投影片
## 表格範例

| 功能 | 支援 | 備註 |
|------|------|------|
| 即時編輯 | ✅ | 左側編輯，右側預覽 |
| 多格式 | ✅ | MD、JSON、XML |
| 匯出 | ✅ | 下載各種格式 |

---

# 謝謝觀看！
## 開始使用吧 🚀`,

    json: `{
  "slideshow": {
    "title": "JSON 格式投影片",
    "author": "React Editor",
    "slides": [
      {
        "title": "歡迎使用 JSON 投影片",
        "content": [
          "這是使用 JSON 格式的投影片",
          "資料結構清晰易懂",
          "適合程式化處理"
        ],
        "style": {
          "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          "color": "white"
        }
      },
      {
        "title": "JSON 的優點",
        "content": [
          "標準格式",
          "程式易解析",
          "支援複雜資料結構",
          "廣泛支援"
        ],
        "metadata": {
          "slideNumber": 2,
          "duration": 30
        }
      },
      {
        "title": "實際應用",
        "content": [
          "API 資料傳輸",
          "設定檔案",
          "資料庫存儲",
          "前後端通訊"
        ],
        "code": {
          "language": "javascript",
          "content": "const data = { message: 'Hello JSON!' };"
        }
      },
      {
        "title": "謝謝觀看",
        "content": [
          "JSON 讓資料結構化",
          "開發更有效率",
          "歡迎嘗試其他格式！"
        ]
      }
    ]
  }
}`,

    xml: `<?xml version="1.0" encoding="UTF-8"?>
<slideshow title="XML 格式投影片" version="1.0">
  <metadata>
    <author>React Editor</author>
    <created>2024-07-08</created>
    <description>展示 XML 格式的投影片系統</description>
  </metadata>
  
  <slide id="1" type="title">
    <title size="large" color="#2c3e50">歡迎使用 XML 投影片</title>
    <subtitle color="#7f8c8d">結構化標記語言的展示</subtitle>
    <content>
      <paragraph>XML 提供了強大的結構化能力</paragraph>
      <list type="bullet">
        <item>標準化格式</item>
        <item>可擴展性強</item>
        <item>支援屬性和命名空間</item>
      </list>
    </content>
  </slide>

  <slide id="2" type="content">
    <title>XML 的特色</title>
    <content>
      <section title="語法特點">
        <item priority="high">嚴格的語法規則</item>
        <item priority="medium">豐富的屬性支援</item>
        <item priority="high">層次化結構</item>
      </section>
      <section title="應用領域">
        <item>配置文件</item>
        <item>數據交換</item>
        <item>文檔格式</item>
      </section>
    </content>
  </slide>

  <slide id="3" type="code">
    <title>XML 範例</title>
    <content>
      <code language="xml">
&lt;book id="123"&gt;
  &lt;title&gt;學習 XML&lt;/title&gt;
  &lt;author nationality="Taiwan"&gt;張三&lt;/author&gt;
  &lt;price currency="TWD"&gt;450&lt;/price&gt;
&lt;/book&gt;
      </code>
    </content>
  </slide>

  <slide id="4" type="conclusion">
    <title>總結</title>
    <content>
      <paragraph emphasis="bold">XML 是強大的標記語言</paragraph>
      <paragraph>適合複雜的資料結構</paragraph>
      <callout type="success">
        感謝使用 XML 格式投影片！
      </callout>
    </content>
  </slide>
</slideshow>`
  });

  // Markdown 解析器（簡化版）
  const parseMarkdown = (content) => {
    return content.split('---').map(slideContent => {
      const lines = slideContent.trim().split('\n');
      let html = '';
      let inCodeBlock = false;
      let codeLanguage = '';
      
      for (let line of lines) {
        if (line.startsWith('```')) {
          if (!inCodeBlock) {
            codeLanguage = line.slice(3);
            html += `<pre class="bg-gray-800 text-green-400 p-4 rounded-lg my-4 overflow-x-auto"><code class="language-${codeLanguage}">`;
            inCodeBlock = true;
          } else {
            html += '</code></pre>';
            inCodeBlock = false;
          }
        } else if (inCodeBlock) {
          html += line + '\n';
        } else if (line.startsWith('# ')) {
          html += `<h1 class="text-4xl font-bold mb-6 text-center text-blue-600 border-b-2 border-blue-500 pb-2">${line.slice(2)}</h1>`;
        } else if (line.startsWith('## ')) {
          html += `<h2 class="text-3xl font-semibold mb-4 text-center text-gray-700">${line.slice(3)}</h2>`;
        } else if (line.startsWith('### ')) {
          html += `<h3 class="text-2xl font-medium mb-3 text-gray-600">${line.slice(4)}</h3>`;
        } else if (line.startsWith('- ')) {
          html += `<li class="text-lg mb-2">${formatInlineMarkdown(line.slice(2))}</li>`;
        } else if (line.startsWith('> ')) {
          html += `<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-600 my-4">${line.slice(2)}</blockquote>`;
        } else if (line.startsWith('|')) {
          // 簡單表格處理
          const cells = line.split('|').filter(cell => cell.trim());
          const isHeader = line.includes('---');
          if (!isHeader) {
            html += '<tr>';
            cells.forEach(cell => {
              html += `<td class="border px-4 py-2">${cell.trim()}</td>`;
            });
            html += '</tr>';
          }
        } else if (line.trim() && !line.includes('---')) {
          html += `<p class="text-lg mb-4 leading-relaxed">${formatInlineMarkdown(line)}</p>`;
        }
      }
      
      // 包裝列表項目
      html = html.replace(/(<li[^>]*>.*?<\/li>)/gs, '<ul class="list-disc ml-6 space-y-2">$1</ul>');
      html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');
      
      return html;
    });
  };

  const formatInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-800">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-600">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-2 py-1 rounded text-sm font-mono text-red-600">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline hover:text-blue-700">$1</a>');
  };

  // JSON 渲染器
  const renderJsonSlide = (jsonContent, slideIndex) => {
    try {
      const data = JSON.parse(jsonContent);
      const slide = data.slideshow?.slides?.[slideIndex];
      
      if (!slide) return <div className="text-center text-gray-500">投影片不存在</div>;
      
      return (
        <div className="h-full flex flex-col justify-center items-center p-8" 
             style={slide.style || {}}>
          <h1 className="text-4xl font-bold mb-8 text-center">{slide.title}</h1>
          <div className="space-y-4 text-center max-w-4xl">
            {slide.content?.map((item, index) => (
              <p key={index} className="text-xl leading-relaxed">{item}</p>
            ))}
            {slide.code && (
              <pre className="bg-gray-800 text-green-400 p-6 rounded-lg text-left mt-6 overflow-x-auto">
                <code>{slide.code.content}</code>
              </pre>
            )}
          </div>
          {slide.metadata && (
            <div className="absolute bottom-4 right-4 text-sm opacity-60">
              投影片 {slide.metadata.slideNumber}
            </div>
          )}
        </div>
      );
    } catch (error) {
      return <div className="text-red-500 text-center p-8">JSON 格式錯誤: {error.message}</div>;
    }
  };

  // XML 渲染器
  const renderXmlSlide = (xmlContent, slideIndex) => {
    try {
      // 簡單的 XML 解析（實際專案建議使用 DOMParser 或專門的 XML 解析庫）
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      const slides = xmlDoc.querySelectorAll('slide');
      const slide = slides[slideIndex];
      
      if (!slide) return <div className="text-center text-gray-500">投影片不存在</div>;
      
      const title = slide.querySelector('title')?.textContent || '無標題';
      const subtitle = slide.querySelector('subtitle')?.textContent;
      const paragraphs = slide.querySelectorAll('paragraph');
      const lists = slide.querySelectorAll('list');
      const code = slide.querySelector('code');
      const callout = slide.querySelector('callout');
      
      return (
        <div className="h-full flex flex-col justify-center p-8">
          <h1 className="text-4xl font-bold mb-6 text-center text-purple-600">{title}</h1>
          {subtitle && <h2 className="text-2xl text-center text-gray-600 mb-8">{subtitle}</h2>}
          
          <div className="space-y-6 max-w-4xl mx-auto">
            {Array.from(paragraphs).map((p, index) => (
              <p key={index} className={`text-lg leading-relaxed ${
                p.getAttribute('emphasis') === 'bold' ? 'font-bold text-xl' : ''
              }`}>
                {p.textContent}
              </p>
            ))}
            
            {Array.from(lists).map((list, listIndex) => (
              <ul key={listIndex} className="list-disc ml-6 space-y-2">
                {Array.from(list.querySelectorAll('item')).map((item, itemIndex) => (
                  <li key={itemIndex} className={`text-lg ${
                    item.getAttribute('priority') === 'high' ? 'font-semibold text-blue-600' : ''
                  }`}>
                    {item.textContent}
                  </li>
                ))}
              </ul>
            ))}
            
            {code && (
              <pre className="bg-gray-800 text-green-400 p-6 rounded-lg overflow-x-auto">
                <code>{code.textContent}</code>
              </pre>
            )}
            
            {callout && (
              <div className={`p-4 rounded-lg ${
                callout.getAttribute('type') === 'success' 
                  ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
                  : 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
              }`}>
                {callout.textContent}
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      return <div className="text-red-500 text-center p-8">XML 解析錯誤: {error.message}</div>;
    }
  };

  // 獲取當前格式的投影片
  const getCurrentSlides = () => {
    switch (currentFormat) {
      case 'markdown':
        return parseMarkdown(contents.markdown);
      case 'json':
        try {
          const data = JSON.parse(contents.json);
          return data.slideshow?.slides || [];
        } catch {
          return [];
        }
      case 'xml':
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(contents.xml, 'text/xml');
          return Array.from(xmlDoc.querySelectorAll('slide'));
        } catch {
          return [];
        }
      default:
        return [];
    }
  };

  const slides = getCurrentSlides();
  const totalSlides = slides.length;

  // 渲染當前投影片
  const renderCurrentSlide = () => {
    switch (currentFormat) {
      case 'markdown':
        return (
          <div 
            className="h-full p-8 overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: slides[currentSlide] || '' }}
          />
        );
      case 'json':
        return renderJsonSlide(contents.json, currentSlide);
      case 'xml':
        return renderXmlSlide(contents.xml, currentSlide);
      default:
        return <div>格式錯誤</div>;
    }
  };

  // 匯出功能
  const exportSlides = () => {
    const content = contents[currentFormat];
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slides.${currentFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="h-full bg-white">
          {renderCurrentSlide()}
        </div>
        
        {/* 播放模式控制 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black bg-opacity-50 px-6 py-3 rounded-full">
          <button
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
          >
            <ChevronLeft size={24} />
          </button>
          
          <span className="text-white font-medium">
            {currentSlide + 1} / {totalSlides}
          </span>
          
          <button
            onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
            disabled={currentSlide === totalSlides - 1}
            className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 disabled:opacity-50"
          >
            <ChevronRight size={24} />
          </button>
          
          <button
            onClick={() => setIsPlaying(false)}
            className="text-white px-4 py-2 bg-red-600 rounded-full hover:bg-red-700 ml-4"
          >
            退出
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* 工具列 */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">🎯 多格式投影片編輯器</h1>
          
          <div className="flex items-center gap-4">
            {/* 格式選擇 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'markdown', label: 'Markdown', icon: FileText },
                { key: 'json', label: 'JSON', icon: Code },
                { key: 'xml', label: 'XML', icon: Database }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentFormat(key);
                    setCurrentSlide(0);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                    currentFormat === key 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            
            <button
              onClick={exportSlides}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              匯出
            </button>
            
            <button
              onClick={() => setIsPlaying(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play size={16} />
              播放
            </button>
          </div>
        </div>
      </div>

      {/* 主要內容區 */}
      <div className="flex-1 flex">
        {/* 左側編輯器 */}
        <div className="w-1/2 bg-white border-r flex flex-col">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-medium text-gray-700">
              {currentFormat.toUpperCase()} 編輯器
            </h3>
          </div>
          
          <textarea
            value={contents[currentFormat]}
            onChange={(e) => setContents(prev => ({
              ...prev,
              [currentFormat]: e.target.value
            }))}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder={`在這裡輸入 ${currentFormat.toUpperCase()} 格式的內容...`}
          />
        </div>

        {/* 右側預覽 */}
        <div className="w-1/2 bg-gray-50 flex flex-col">
          <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-gray-700">即時預覽</h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              
              <span className="text-sm font-medium px-3 py-1 bg-white rounded">
                {currentSlide + 1} / {totalSlides}
              </span>
              
              <button
                onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
                disabled={currentSlide === totalSlides - 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-white m-4 rounded-lg shadow-sm overflow-hidden">
            {renderCurrentSlide()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;