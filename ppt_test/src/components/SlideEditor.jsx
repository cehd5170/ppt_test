import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Plus, Type, Square, Triangle,
  Play, Trash2, RotateCw, Share2
} from 'lucide-react';

const SlideEditor = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dataFormat, setDataFormat] = useState('json');
  const [isLoading, setIsLoading] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const canvasRef = useRef(null);

  // 動態載入解析套件
  const loadParsingLibraries = async () => {
    const libraries = {};
    
    try {
      // 載入 marked (Markdown 解析)
      if (!window.marked) {
        await import('https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js');
      }
      libraries.marked = window.marked;
      
      // 載入 js-yaml (YAML 解析，也可用於結構化 Markdown)
      if (!window.jsyaml) {
        await import('https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js');
      }
      libraries.yaml = window.jsyaml;
      
      return libraries;
    } catch (error) {
      console.error('載入解析套件失敗:', error);
      return {};
    }
  };

  // 初始化範例資料
  useEffect(() => {
    const exampleSlides = [
      {
        id: 1,
        background: '#ffffff',
        elements: [
          {
            id: 'text-1',
            type: 'text',
            content: '動態簡報編輯器',
            position: { x: 200, y: 100 },
            size: { width: 400, height: 80 },
            rotation: 0,
            style: { fontSize: '2.5rem', fontWeight: 'bold', color: '#2c3e50', textAlign: 'center' }
          },
          {
            id: 'shape-1',
            type: 'shape',
            shapeType: 'pyramid',
            color: 'blue',
            labels: ['需求分析', '系統設計', '開發實作', '測試部署'],
            position: { x: 200, y: 200 },
            size: { width: 400, height: 300 },
            rotation: 0
          }
        ]
      }
    ];
    setSlides(exampleSlides);
  }, []);

  // 處理文件上傳
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      setIsLoading(true);
      
      try {
        // 載入解析套件
        const libraries = await loadParsingLibraries();
        let parsedSlides = [];
        
        // 根據文件副檔名自動判斷格式
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const format = fileExtension === 'md' ? 'markdown' : 
                      fileExtension === 'xml' ? 'xml' : 'json';
        
        switch (format) {
          case 'json':
            parsedSlides = parseJSONWithValidation(content);
            break;
          case 'markdown':
            parsedSlides = await parseMarkdownWithLibrary(content, libraries.marked);
            break;
          case 'xml':
            parsedSlides = parseXMLWithDOMParser(content);
            break;
        }
        
        setSlides(parsedSlides);
        setCurrentSlide(0);
        alert(`${format.toUpperCase()} 文件載入成功！共 ${parsedSlides.length} 張投影片`);
      } catch (error) {
        console.error('文件解析失敗:', error);
        alert(`文件解析錯誤: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsText(file);
  };

  // 從 API 載入資料
  const loadDataFromAPI = async (endpoint, format) => {
    if (!endpoint) {
      alert('請輸入 API 端點');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.text();
      const libraries = await loadParsingLibraries();
      let parsedSlides = [];
      
      switch (format) {
        case 'json':
          parsedSlides = parseJSONWithValidation(data);
          break;
        case 'markdown':
          parsedSlides = await parseMarkdownWithLibrary(data, libraries.marked);
          break;
        case 'xml':
          parsedSlides = parseXMLWithDOMParser(data);
          break;
      }
      
      setSlides(parsedSlides);
      setCurrentSlide(0);
      alert(`API 資料載入成功！共 ${parsedSlides.length} 張投影片`);
    } catch (error) {
      console.error('載入失敗:', error);
      alert(`載入失敗: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 使用 JSON.parse 和 JSON Schema 驗證的 JSON 解析
  const parseJSONWithValidation = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      
      // 驗證 JSON 結構
      if (!data) {
        throw new Error('JSON 資料為空');
      }
      
      // 如果是投影片陣列
      if (Array.isArray(data)) {
        return data.map((slide, index) => ({
          id: slide.id || index + 1,
          background: slide.background || '#ffffff',
          elements: Array.isArray(slide.elements) ? slide.elements.map(el => ({
            id: el.id || `element-${Date.now()}-${Math.random()}`,
            type: el.type || 'text',
            ...el,
            position: el.position || { x: 100, y: 100 },
            size: el.size || { width: 200, height: 100 },
            rotation: el.rotation || 0
          })) : []
        }));
      }
      
      // 如果有 slides 屬性
      if (data.slides && Array.isArray(data.slides)) {
        return parseJSONWithValidation(JSON.stringify(data.slides));
      }
      
      // 如果是單一投影片物件
      if (data.elements || data.background) {
        return [data];
      }
      
      throw new Error('無法識別的 JSON 格式，需要包含 slides 陣列或 elements');
      
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`JSON 語法錯誤: ${error.message}`);
      }
      throw error;
    }
  };

  // 使用 marked 套件的 Markdown 解析
  const parseMarkdownWithLibrary = async (markdownString, marked) => {
    if (!marked) {
      throw new Error('Marked 套件載入失敗，使用簡化解析');
    }
    
    try {
      // 分割投影片（使用 --- 分隔）
      const slideTexts = markdownString.split(/^---$/gm).filter(text => text.trim());
      
      return slideTexts.map((slideText, index) => {
        const trimmedText = slideText.trim();
        const elements = [];
        
        // 檢查是否有特殊形狀標記（在 marked 解析前處理）
        const shapeMatch = trimmedText.match(/\[shape:(\w+):(\w+):(.+)\]/);
        let contentForMarked = trimmedText;
        
        if (shapeMatch) {
          const [fullMatch, shapeType, color, labels] = shapeMatch;
          // 移除形狀標記，避免被 marked 解析
          contentForMarked = trimmedText.replace(fullMatch, '').trim();
          
          // 添加形狀元素
          elements.push({
            id: `shape-${index}`,
            type: 'shape',
            shapeType: shapeType,
            color: color,
            labels: labels.split(',').map(l => l.trim()),
            position: { x: 200, y: 300 },
            size: { width: 400, height: 300 },
            rotation: 0
          });
        }
        
        // 使用 marked 解析剩餘的 Markdown 內容
        const htmlContent = marked.parse(contentForMarked);
        
        // 將 HTML 轉換為可編輯的元素
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        let yPosition = 100;
        
        // 處理標題元素
        const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading, headingIndex) => {
          const level = parseInt(heading.tagName.charAt(1));
          elements.push({
            id: `heading-${index}-${headingIndex}`,
            type: 'text',
            content: heading.innerHTML,
            position: { x: 100, y: yPosition },
            size: { width: 600, height: 60 + (20 * (4 - level)) },
            rotation: 0,
            style: { 
              fontSize: `${3 - (level * 0.3)}rem`,
              fontWeight: level <= 2 ? 'bold' : 'normal',
              color: level === 1 ? '#2c3e50' : '#34495e',
              textAlign: level <= 2 ? 'center' : 'left'
            }
          });
          yPosition += 80 + (10 * (4 - level));
        });
        
        // 處理段落元素
        const paragraphs = tempDiv.querySelectorAll('p');
        paragraphs.forEach((paragraph, pIndex) => {
          if (paragraph.innerHTML.trim()) {
            elements.push({
              id: `paragraph-${index}-${pIndex}`,
              type: 'text',
              content: paragraph.innerHTML,
              position: { x: 100, y: yPosition },
              size: { width: 600, height: 80 },
              rotation: 0,
              style: { 
                fontSize: '1.2rem', 
                color: '#2c3e50',
                lineHeight: '1.6'
              }
            });
            yPosition += 100;
          }
        });
        
        // 處理列表元素
        const lists = tempDiv.querySelectorAll('ul, ol');
        lists.forEach((list, listIndex) => {
          elements.push({
            id: `list-${index}-${listIndex}`,
            type: 'text',
            content: list.outerHTML,
            position: { x: 100, y: yPosition },
            size: { width: 600, height: list.children.length * 40 + 40 },
            rotation: 0,
            style: { 
              fontSize: '1.1rem', 
              color: '#2c3e50',
              lineHeight: '1.8'
            }
          });
          yPosition += list.children.length * 40 + 60;
        });
        
        // 處理程式碼區塊
        const codeBlocks = tempDiv.querySelectorAll('pre');
        codeBlocks.forEach((codeBlock, codeIndex) => {
          elements.push({
            id: `code-${index}-${codeIndex}`,
            type: 'text',
            content: codeBlock.outerHTML,
            position: { x: 100, y: yPosition },
            size: { width: 600, height: 120 },
            rotation: 0,
            style: { 
              fontSize: '0.9rem', 
              color: '#2c3e50',
              fontFamily: 'monospace',
              backgroundColor: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px'
            }
          });
          yPosition += 140;
        });
        
        // 處理引用區塊
        const blockquotes = tempDiv.querySelectorAll('blockquote');
        blockquotes.forEach((blockquote, bqIndex) => {
          elements.push({
            id: `blockquote-${index}-${bqIndex}`,
            type: 'text',
            content: blockquote.innerHTML,
            position: { x: 120, y: yPosition },
            size: { width: 560, height: 80 },
            rotation: 0,
            style: { 
              fontSize: '1.1rem', 
              color: '#6c757d',
              fontStyle: 'italic',
              borderLeft: '4px solid #007bff',
              paddingLeft: '20px',
              backgroundColor: '#f8f9fa'
            }
          });
          yPosition += 100;
        });
        
        // 如果沒有解析到任何元素，添加一個預設的文字元素
        if (elements.length === 0) {
          elements.push({
            id: `default-${index}`,
            type: 'text',
            content: htmlContent || '空白投影片',
            position: { x: 100, y: 100 },
            size: { width: 600, height: 400 },
            rotation: 0,
            style: { fontSize: '1.2rem', color: '#2c3e50' }
          });
        }
        
        return {
          id: index + 1,
          background: '#ffffff',
          elements
        };
      });
      
    } catch (error) {
      throw new Error(`Markdown 解析錯誤: ${error.message}`);
    }
  };

  // 使用 DOMParser 的 XML 解析
  const parseXMLWithDOMParser = (xmlString) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // 檢查 XML 解析錯誤
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error(`XML 格式錯誤: ${parserError.textContent}`);
      }
      
      const slideNodes = xmlDoc.querySelectorAll('slide');
      
      if (slideNodes.length === 0) {
        throw new Error('XML 中沒有找到 <slide> 元素');
      }
      
      return Array.from(slideNodes).map((slideNode, index) => {
        const elements = [];
        
        // 解析文字元素
        Array.from(slideNode.querySelectorAll('text')).forEach((textNode, textIndex) => {
          elements.push({
            id: `text-${index}-${textIndex}`,
            type: 'text',
            content: textNode.textContent || '空白文字',
            position: { 
              x: parseInt(textNode.getAttribute('x')) || 100, 
              y: parseInt(textNode.getAttribute('y')) || 100 
            },
            size: { 
              width: parseInt(textNode.getAttribute('width')) || 200, 
              height: parseInt(textNode.getAttribute('height')) || 50 
            },
            style: {
              fontSize: textNode.getAttribute('fontSize') || '1rem',
              color: textNode.getAttribute('color') || '#000000',
              fontWeight: textNode.getAttribute('fontWeight') || 'normal'
            },
            rotation: parseInt(textNode.getAttribute('rotation')) || 0
          });
        });

        // 解析形狀元素
        Array.from(slideNode.querySelectorAll('shape')).forEach((shapeNode, shapeIndex) => {
          const labels = Array.from(shapeNode.querySelectorAll('label')).map(label => 
            label.textContent || '標籤'
          );
          
          elements.push({
            id: `shape-${index}-${shapeIndex}`,
            type: 'shape',
            shapeType: shapeNode.getAttribute('type') || 'rectangle',
            color: shapeNode.getAttribute('color') || 'blue',
            labels: labels.length > 0 ? labels : ['預設標籤'],
            position: { 
              x: parseInt(shapeNode.getAttribute('x')) || 200, 
              y: parseInt(shapeNode.getAttribute('y')) || 200 
            },
            size: { 
              width: parseInt(shapeNode.getAttribute('width')) || 300, 
              height: parseInt(shapeNode.getAttribute('height')) || 200 
            },
            rotation: parseInt(shapeNode.getAttribute('rotation')) || 0
          });
        });

        return {
          id: parseInt(slideNode.getAttribute('id')) || index + 1,
          background: slideNode.getAttribute('background') || '#ffffff',
          elements
        };
      });
      
    } catch (error) {
      if (error.message.includes('XML')) {
        throw error;
      }
      throw new Error(`XML 解析錯誤: ${error.message}`);
    }
  };

  // 更新元素
  const updateElement = (elementId, updates) => {
    setSlides(prevSlides => 
      prevSlides.map((slide, slideIndex) => 
        slideIndex === currentSlide 
          ? {
              ...slide,
              elements: slide.elements.map(element =>
                element.id === elementId 
                  ? { ...element, ...updates }
                  : element
              )
            }
          : slide
      )
    );
  };

  // 新增元素
  const addElement = (type, shapeType = null) => {
    const newElement = {
      id: `${type}-${Date.now()}`,
      type: type,
      position: { x: 200, y: 200 },
      size: { width: 200, height: 100 },
      rotation: 0
    };

    if (type === 'text') {
      newElement.content = '點擊編輯文字';
      newElement.style = {
        fontSize: '1.2rem',
        color: '#2c3e50',
        fontWeight: 'normal'
      };
    } else if (type === 'shape') {
      newElement.shapeType = shapeType || 'rectangle';
      newElement.color = 'blue';
      newElement.labels = ['新標籤'];
      newElement.size = { width: 300, height: 200 };
    }

    setSlides(prevSlides => 
      prevSlides.map((slide, slideIndex) => 
        slideIndex === currentSlide 
          ? { ...slide, elements: [...slide.elements, newElement] }
          : slide
      )
    );
  };

  // 刪除元素
  const deleteElement = (elementId) => {
    setSlides(prevSlides => 
      prevSlides.map((slide, slideIndex) => 
        slideIndex === currentSlide 
          ? { ...slide, elements: slide.elements.filter(el => el.id !== elementId) }
          : slide
      )
    );
    setSelectedElement(null);
  };

  // 拖拽處理
  const handleMouseDown = (e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = currentSlideData?.elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left - element.position.x,
        y: e.clientY - rect.top - element.position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const newX = e.clientX - rect.left - dragOffset.x;
      const newY = e.clientY - rect.top - dragOffset.y;
      
      updateElement(selectedElement, {
        position: { x: Math.max(0, newX), y: Math.max(0, newY) }
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedElement, dragOffset]);

  // 渲染形狀
  const renderShape = (element) => {
    const { shapeType, color, labels, size, rotation } = element;
    
    if (shapeType === 'pyramid') {
      return (
        <div
          className="relative"
          style={{
            width: size.width,
            height: size.height,
            transform: `rotate(${rotation}deg)`
          }}
        >
          {labels.map((label, index) => {
            const levelHeight = size.height / labels.length;
            const levelWidth = size.width * (1 - (index * 0.15));
            const levelTop = index * levelHeight;
            const levelLeft = (size.width - levelWidth) / 2;
            
            return (
              <div
                key={index}
                className="absolute flex items-center justify-center font-medium text-white border-2 border-white"
                style={{
                  top: levelTop,
                  left: levelLeft,
                  width: levelWidth,
                  height: levelHeight,
                  backgroundColor: `hsl(${220 + index * 30}, 70%, ${50 + index * 10}%)`
                }}
              >
                <input
                  className="bg-transparent text-center text-white border-0 outline-0 w-full"
                  value={label}
                  onChange={(e) => {
                    const newLabels = [...labels];
                    newLabels[index] = e.target.value;
                    updateElement(element.id, { labels: newLabels });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            );
          })}
        </div>
      );
    }
    
    // 預設矩形
    return (
      <div
        className="border-4 rounded-lg flex items-center justify-center font-medium text-white"
        style={{
          width: size.width,
          height: size.height,
          backgroundColor: color === 'blue' ? '#3498db' : color,
          borderColor: '#fff',
          transform: `rotate(${rotation}deg)`
        }}
      >
        <input
          className="bg-transparent text-center text-white border-0 outline-0 w-full"
          value={labels[0] || '形狀'}
          onChange={(e) => updateElement(element.id, { labels: [e.target.value] })}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  // 渲染元素
  const renderElement = (element) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className={`absolute cursor-move select-none ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{
          left: element.position.x,
          top: element.position.y,
          zIndex: isSelected ? 1000 : 1
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        onClick={() => setSelectedElement(element.id)}
      >
        {element.type === 'text' ? (
          <div
            contentEditable
            suppressContentEditableWarning={true}
            className="outline-none border-2 border-dashed border-transparent hover:border-gray-300 p-2 rounded"
            style={{
              width: element.size.width,
              height: element.size.height,
              transform: `rotate(${element.rotation}deg)`,
              ...element.style
            }}
            onBlur={(e) => updateElement(element.id, { content: e.target.innerText })}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        ) : element.type === 'shape' ? (
          renderShape(element)
        ) : null}
        
        {isSelected && (
          <>
            <button
              className="absolute -top-6 -right-6 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                deleteElement(element.id);
              }}
            >
              <Trash2 size={10} />
            </button>
            
            <button
              className="absolute -top-6 -left-6 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-blue-600"
              onClick={(e) => {
                e.stopPropagation();
                updateElement(element.id, { rotation: (element.rotation + 45) % 360 });
              }}
            >
              <RotateCw size={10} />
            </button>
          </>
        )}
      </div>
    );
  };

  const currentSlideData = slides[currentSlide];

  // 播放模式
  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div 
          className="w-full h-full relative"
          style={{ background: currentSlideData?.background || '#ffffff' }}
        >
          {currentSlideData?.elements.map(element => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: `${(element.position.x / 800) * 100}%`,
                top: `${(element.position.y / 600) * 100}%`,
                width: `${(element.size.width / 800) * 100}%`,
                height: `${(element.size.height / 600) * 100}%`,
                transform: `rotate(${element.rotation}deg)`
              }}
            >
              {element.type === 'text' ? (
                <div style={element.style} dangerouslySetInnerHTML={{ __html: element.content }} />
              ) : element.type === 'shape' ? (
                renderShape(element)
              ) : null}
            </div>
          ))}
          
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black bg-opacity-70 px-6 py-3 rounded-full">
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full disabled:opacity-50"
            >
              <ChevronLeft size={24} />
            </button>
            
            <span className="text-white font-medium">
              {currentSlide + 1} / {slides.length}
            </span>
            
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full disabled:opacity-50"
            >
              <ChevronRight size={24} />
            </button>
            
            <button
              onClick={() => setIsPlaying(false)}
              className="text-white px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full ml-4"
            >
              退出
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在載入資料...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 頂部工具列 */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center px-4 py-2 border-b">
          <h1 className="text-xl font-medium text-gray-700 mr-8">📊 動態簡報編輯器</h1>
          <div className="flex gap-1 text-sm">
            <button className="px-3 py-1 hover:bg-gray-100 rounded">檔案</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded">編輯</button>
            <button className="px-3 py-1 hover:bg-gray-100 rounded">插入</button>
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <Play size={16} />
              播放
            </button>
          </div>
        </div>

        {/* 資料載入區 */}
        <div className="flex items-center px-4 py-2 gap-4 bg-gray-50">
          <span className="text-sm font-medium">📁 資料來源:</span>
          
          {/* 文件上傳 */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded cursor-pointer hover:bg-blue-200 transition-colors">
              <span className="text-sm">📤 上傳文件</span>
              <input
                type="file"
                accept=".json,.md,.xml,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-gray-500">支援 JSON, MD, XML</span>
          </div>
          
          <div className="w-px h-6 bg-gray-300"></div>
          
          {/* API 載入 */}
          <div className="flex items-center gap-2">
            <span className="text-sm">🌐 API:</span>
            <select 
              value={dataFormat} 
              onChange={(e) => setDataFormat(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
            >
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
              <option value="xml">XML</option>
            </select>
            
            <input
              type="text"
              placeholder="輸入 API 端點 URL..."
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              className="w-64 px-3 py-1 border rounded text-sm"
            />
            
            <button
              onClick={() => loadDataFromAPI(apiEndpoint, dataFormat)}
              disabled={!apiEndpoint || isLoading}
              className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              {isLoading ? '載入中...' : '載入'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 左側投影片縮圖 */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">投影片</span>
              <button
                onClick={() => {
                  const newSlide = {
                    id: Date.now(),
                    background: '#ffffff',
                    elements: []
                  };
                  setSlides([...slides, newSlide]);
                  setCurrentSlide(slides.length);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="space-y-2">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`relative cursor-pointer border rounded-lg overflow-hidden transition-all ${
                    index === currentSlide 
                      ? 'border-blue-500 ring-2 ring-blue-100' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div 
                    className="w-full h-32 relative"
                    style={{ background: slide.background }}
                  >
                    <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中央編輯區域 */}
        <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center">
          <div className="relative">
            <div 
              ref={canvasRef}
              className="relative bg-white rounded-lg shadow-xl"
              style={{
                width: '800px',
                height: '600px',
                background: currentSlideData?.background || '#ffffff'
              }}
              onClick={() => setSelectedElement(null)}
            >
              {currentSlideData?.elements.map(element => renderElement(element))}
              
              {/* 新增元素按鈕 */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addElement('text');
                  }}
                  className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
                  title="新增文字"
                >
                  <Type size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addElement('shape', 'rectangle');
                  }}
                  className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700"
                  title="新增矩形"
                >
                  <Square size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addElement('shape', 'pyramid');
                  }}
                  className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700"
                  title="新增金字塔"
                >
                  <Triangle size={20} />
                </button>
              </div>
            </div>

            {/* 投影片導航 */}
            <button
              onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
              disabled={currentSlide === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg disabled:opacity-50"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button
              onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
              disabled={currentSlide === slides.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white p-3 rounded-full shadow-lg disabled:opacity-50"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideEditor;