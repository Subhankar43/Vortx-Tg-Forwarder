from telethon import TelegramClient
from telethon.tl.types import (
    MessageMediaDocument, MessageMediaPhoto,
    DocumentAttributeFilename, DocumentAttributeVideo, DocumentAttributeAudio
)
from datetime import datetime, timezone
import asyncio
import base64
import tempfile
import json
import os


def load_history():
    if os.path.exists("history.json"):
        with open("history.json", "r") as f:
            return json.load(f)
    return []


class TelegramForwarder:
    def __init__(self):
        self.state = "stopped"
        self._pause_event = asyncio.Event()
        self._pause_event.set()
        self._stop_flag = False
        self.client = None

    def pause(self):
        self.state = "paused"
        self._pause_event.clear()

    def resume(self):
        self.state = "running"
        self._pause_event.set()

    async def stop(self):
        self._stop_flag = True
        self._pause_event.set()
        self.state = "stopped"
        if self.client and self.client.is_connected():
            await self.client.disconnect()

    def _get_file_type(self, message):
        if message.media is None:
            return None
        if isinstance(message.media, MessageMediaPhoto):
            return "image"
        if isinstance(message.media, MessageMediaDocument):
            doc = message.media.document
            for attr in doc.attributes:
                if isinstance(attr, DocumentAttributeVideo):
                    return "video"
                if isinstance(attr, DocumentAttributeAudio):
                    return "audio"
                if isinstance(attr, DocumentAttributeFilename):
                    name = attr.file_name.lower()
                    if name.endswith(".pdf"):
                        return "pdf"
                    elif name.endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
                        return "image"
                    elif name.endswith((".mp4", ".mkv", ".avi", ".mov")):
                        return "video"
                    elif name.endswith((".mp3", ".wav", ".ogg", ".flac")):
                        return "audio"
                    else:
                        return "document"
            return "document"
        return "other"

    def _get_filename(self, message):
        if isinstance(message.media, MessageMediaPhoto):
            return f"photo_{message.id}.jpg"
        if isinstance(message.media, MessageMediaDocument):
            for attr in message.media.document.attributes:
                if isinstance(attr, DocumentAttributeFilename):
                    return attr.file_name
        return f"file_{message.id}"

    async def start(self, config, date_str, file_filter, on_log):
        self._stop_flag = False
        self._pause_event.set()
        self.state = "running"

        api_id = int(config["api_id"])
        api_hash = config["api_hash"]
        phone = config["phone"]
        source = config["source_channel"]
        target = config["target_channel"]

        await on_log("🔌 Connecting to Telegram...", "info")

        try:
            session_b64 = os.environ.get("TG_SESSION_B64")
            if session_b64:
                session_data = base64.b64decode(session_b64)
                session_path = os.path.join(tempfile.gettempdir(), "tg_session")
                with open(session_path + ".session", "wb") as f:
                    f.write(session_data)
            else:
                session_path = "tg_session"

            self.client = TelegramClient(session_path, api_id, api_hash)
            await self.client.start(phone=phone)
            await on_log("✅ Connected to Telegram successfully!", "success")
        except Exception as e:
            await on_log(f"❌ Connection failed: {str(e)}", "error")
            self.state = "stopped"
            return

        try:
            target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            await on_log(f"📅 Scanning messages from: {date_str}", "info")
            await on_log(f"🔍 File filter: {file_filter}", "info")

            history = load_history()
            already_forwarded_ids = {h.get("message_id") for h in history}

            messages_to_forward = []

            async for message in self.client.iter_messages(int(source), limit=200):
                if self._stop_flag:
                    break

                msg_date = message.date.astimezone().date()
                if msg_date < target_date:
                    break
                if msg_date != target_date:
                    continue
                if not message.media:
                    continue

                file_type = self._get_file_type(message)
                if file_type is None:
                    continue

                if file_filter != "all" and file_type != file_filter:
                    continue

                if message.id in already_forwarded_ids:
                    await on_log(f"⏭ Skipping already forwarded: {self._get_filename(message)}", "info")
                    continue

                messages_to_forward.append((message, file_type))

            if not messages_to_forward:
                await on_log(f"📭 No new files found for {date_str}", "info")
                self.state = "stopped"
                return

            await on_log(f"📦 Found {len(messages_to_forward)} new file(s) to forward", "info")

            forwarded = 0
            failed = 0

            for message, file_type in messages_to_forward:
                if self._stop_flag:
                    await on_log("⛔ Forwarding stopped by user", "info")
                    break

                await self._pause_event.wait()

                if self._stop_flag:
                    break

                filename = self._get_filename(message)
                file_info = {"filename": filename, "file_type": file_type, "message_id": message.id}

                try:
                    await self.client.forward_messages(int(target), message)
                    forwarded += 1
                    await on_log(f"✅ Forwarded: {filename}", "success", file_info)
                    await asyncio.sleep(1.5)
                except Exception as e:
                    failed += 1
                    await on_log(f"❌ Failed: {filename} — {str(e)}", "error", file_info)
                    await asyncio.sleep(2)

            await on_log(
                f"🏁 Done! Forwarded: {forwarded} | Failed: {failed}",
                "success" if failed == 0 else "info"
            )

        except Exception as e:
            import traceback
            await on_log(f"❌ Error: {str(e)}", "error")
            print("FULL ERROR:", traceback.format_exc())
        finally:
            self.state = "stopped"
            if self.client and self.client.is_connected():
                await self.client.disconnect()