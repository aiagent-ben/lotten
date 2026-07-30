with open('/opt/data/workspace/projects/lotten/src/lib/actions/quote.ts', 'rb') as f:
    content = f.read()

old = (b'    } catch (error) {\n'
       b'      console.error(\'Error revising quote:', error);\n'
       b'      return { success: false, error: \'Failed to revise quote\' };\n'
       b'    }\n'
       b'      }\n'
       b'    }\n'
       b'\n'
       b'export async function acceptQuote')

new = (b'    } catch (error) {\n'
       b'      console.error(\'Error revising quote:', error);\n'
       b'      return { success: false, error: \'Failed to revise quote\' };\n'
       b'    }\n'
       b'  }\n'
       b'\n'
       b'export async function acceptQuote')

if old in content:
    content = content.replace(old, new, 1)
    with open('/opt/data/workspace/projects/lotten/src/lib/actions/quote.ts', 'wb') as f:
        f.write(content)
    print('Fixed!')
else:
    print('Pattern not found')