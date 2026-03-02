import asyncio
import os
import aiohttp
import sys

HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8080))
URL = f'http://{HOST}:{PORT}/ws'

async def main():
    async with aiohttp.ClientSession() as session:
        try:
            async with session.ws_connect(URL) as ws:
                print(f'Connected to {URL}. Type "exit" to quit.')

                async def send_msgs():
                    loop = asyncio.get_event_loop()
                    while not ws.closed:
                        # Non-blocking input using executor
                        msg = await loop.run_in_executor(None, input, "Send: ")
                        if msg.lower() == 'exit':
                            await ws.close()
                            break
                        if not ws.closed:
                            await ws.send_str(msg)

                async def receive_msgs():
                    async for msg in ws:
                        if msg.type == aiohttp.WSMsgType.TEXT:
                            print(f'\nReceived from server: {msg.data}')
                        elif msg.type == aiohttp.WSMsgType.CLOSED:
                            break
                        elif msg.type == aiohttp.WSMsgType.ERROR:
                            break

                # Run both tasks concurrently
                await asyncio.gather(send_msgs(), receive_msgs())
        except aiohttp.ClientConnectorError:
            print(f"Connection failed to {URL}. Is the server running?")

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        pass
    finally:
        loop.close()
