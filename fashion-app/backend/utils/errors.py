class FashionError(Exception):
    def __init__(self, code: str, message: str, status: int = 400, debug_log=None):
        self.code = code
        self.message = message
        self.status = status
        self.debug_log = debug_log if debug_log is not None else []
        super().__init__(message)


ERROR_MESSAGES = {
    "MISSING_REQUIRED": "Thiếu thông tin bắt buộc (ảnh người, mùa, loại quần áo).",
    "INVALID_IMAGE": "Ảnh không hợp lệ hoặc bị hỏng.",
    "POLLINATIONS_AUTH": "API key Pollinations không hợp lệ.",
    "POLLINATIONS_RATE_LIMIT": "Quá giới hạn API, vui lòng thử lại sau.",
    "GENERATION_FAILED": "Không tạo được ảnh quần áo. Hãy thử Remix.",
    "TRYON_FAILED": "Thử đồ ảo thất bại. Vui lòng thử lại.",
    "TRYON_AUTH": "Try-on cần Hugging Face token. Thêm HF_TOKEN vào .env và restart backend.",
    "TRYON_ZERO_GPU": "Hết quota ZeroGPU miễn phí trên Hugging Face (Generate + Try-on dùng chung quota).",
    "FABRIC_VALIDATE_FAILED": "Không thể phân tích vải. Bạn vẫn có thể tiếp tục generate.",
}
