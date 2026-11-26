import sys
import os
import json
import base64

# Suppress TensorFlow & MediaPipe C++ log messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['GLOG_minloglevel'] = '3'

# Force UTF-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

import urllib.request
import urllib.parse
import ipaddress
import socket


def _is_safe_public_url(url_str):
    """Chỉ cho phép URL HTTP/HTTPS trỏ tới IP công cộng để ngăn SSRF."""
    try:
        parsed = urllib.parse.urlparse(url_str)
        if parsed.scheme not in ('http', 'https') or not parsed.hostname:
            return False
        hostname = parsed.hostname.strip('[]').lower()
        if hostname in ('localhost', '127.0.0.1', '::1', '0.0.0.0'):
            return False
        infos = socket.getaddrinfo(hostname, None)
        for info in infos:
            ip_str = info[4][0].split('%')[0]
            ip_obj = ipaddress.ip_address(ip_str)
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
                or ip_obj.is_unspecified
            ):
                return False
        return True
    except Exception:
        return False


def _is_inside_dir(base_dir, candidate_path):
    try:
        real_base = os.path.realpath(base_dir)
        real_target = os.path.realpath(candidate_path)
        return os.path.commonpath([real_base, real_target]) == real_base
    except Exception:
        return False


def normalize_image(img, max_dim=1080):
    if img is None:
        return None
    h, w = img.shape[:2]
    if max(h, w) > max_dim:
        scale = max_dim / float(max(h, w))
        new_w, new_h = int(w * scale), int(h * scale)
        img = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return img


def decode_image(image_source):
    if image_source is None:
        return None
    if isinstance(image_source, np.ndarray):
        return normalize_image(image_source)
    if isinstance(image_source, str):
        image_source = image_source.strip()

        # Chỉ cho phép đọc tệp ảnh nội bộ trong các thư mục công khai được cấp phép
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        allowed_roots = [
            os.path.join(backend_dir, 'hairstyles'),
            os.path.abspath(os.path.join(backend_dir, '..', '..', '..', 'DataPicture')),
            os.path.abspath(os.path.join(backend_dir, '..', '..', 'frontend', 'DataPicture')),
            os.path.abspath(os.path.join(backend_dir, '..', '..', 'frontend', 'assets', 'hairstyles')),
        ]

        path_to_check = image_source
        if image_source.startswith(('http://localhost', 'http://127.0.0.1', 'https://localhost', 'https://127.0.0.1')):
            try:
                parsed_url = urllib.parse.urlparse(image_source)
                path_to_check = parsed_url.path
            except Exception:
                path_to_check = ''

        if not image_source.startswith(('http://', 'https://', 'data:image')) or image_source.startswith(('http://localhost', 'http://127.0.0.1', 'https://localhost', 'https://127.0.0.1')):
            if '..' not in path_to_check and '\x00' not in path_to_check:
                clean_rel = path_to_check.lstrip('/\\').replace('/', os.sep).replace('\\', os.sep)
                clean_dp = clean_rel[len('DataPicture' + os.sep):] if clean_rel.lower().startswith('datapicture' + os.sep) else clean_rel
                safe_base = os.path.basename(clean_rel)
                candidate_paths = [
                    (allowed_roots[0], os.path.join(allowed_roots[0], safe_base)),
                    (allowed_roots[1], os.path.join(allowed_roots[1], clean_dp)),
                    (allowed_roots[2], os.path.join(allowed_roots[2], clean_dp)),
                    (allowed_roots[3], os.path.join(allowed_roots[3], safe_base)),
                ]
                for root_dir, p in candidate_paths:
                    if _is_inside_dir(root_dir, p) and os.path.exists(p) and os.path.isfile(p):
                        try:
                            from PIL import Image, ImageOps
                            pil_img = Image.open(p)
                            pil_img = ImageOps.exif_transpose(pil_img)
                            rgb = np.array(pil_img.convert('RGB'))
                            return normalize_image(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
                        except Exception:
                            loaded = cv2.imread(p)
                            if loaded is not None:
                                return normalize_image(loaded)

        # Chỉ tải URL HTTP(S) từ địa chỉ công cộng hợp lệ (chặn SSRF nội bộ)
        if image_source.startswith(('http://', 'https://')):
            if not _is_safe_public_url(image_source):
                return None
            try:
                req = urllib.request.Request(image_source, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    final_url = resp.geturl()
                    if final_url and not _is_safe_public_url(final_url):
                        return None
                    arr = np.frombuffer(resp.read(12 * 1024 * 1024), np.uint8)
                    try:
                        from PIL import Image, ImageOps
                        import io
                        pil_img = Image.open(io.BytesIO(arr))
                        pil_img = ImageOps.exif_transpose(pil_img)
                        rgb = np.array(pil_img.convert('RGB'))
                        return normalize_image(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
                    except Exception:
                        return normalize_image(cv2.imdecode(arr, cv2.IMREAD_COLOR))
            except Exception:
                pass

        if image_source.startswith('data:image') or len(image_source) > 80:
            try:
                b64_str = image_source.split(',', 1)[1] if ',' in image_source else image_source
                img_bytes = base64.b64decode(b64_str)
                try:
                    from PIL import Image, ImageOps
                    import io
                    pil_img = Image.open(io.BytesIO(img_bytes))
                    pil_img = ImageOps.exif_transpose(pil_img)
                    rgb = np.array(pil_img.convert('RGB'))
                    return normalize_image(cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
                except Exception:
                    arr = np.frombuffer(img_bytes, np.uint8)
                    return normalize_image(cv2.imdecode(arr, cv2.IMREAD_COLOR))
            except Exception:
                return None
    return None

def analyze_portrait(image_source, include_assets=True):
    """
    Phân tích hình học ngũ quan 3D bằng Python Computer Vision (MediaPipe Face Mesh + OpenCV)
    Hoàn toàn cục bộ, 0đ chi phí, thời gian xử lý < 100ms
    """
    img_bgr = decode_image(image_source)
    if img_bgr is None:
        return {"success": False, "error": "Không thể giải mã dữ liệu ảnh."}

    h, w = img_bgr.shape[:2]
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    # 2. Run MediaPipe 3D FaceLandmarker (478 Landmarks - cached singleton)
    detector = get_detector()

    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
    detection = detector.detect(mp_image)

    if not detection.face_landmarks:
        return {
            "success": False,
            "error": "Không tìm thấy khuôn mặt rõ nét trong ảnh. Vui lòng chụp thẳng góc với ánh sáng rõ ràng."
        }

    lm = detection.face_landmarks[0]

    def pt(idx):
        return np.array([lm[idx].x * w, lm[idx].y * h, lm[idx].z * w])

    p_forehead = pt(10)      # Đỉnh trán trung tâm
    p_chin = pt(152)         # Đáy cằm
    p_left_cheek = pt(234)   # Gò má phải (góc nhìn người xem trái)
    p_right_cheek = pt(454)  # Gò má trái (góc nhìn người xem phải)
    p_left_jaw = pt(58)      # Góc hàm trái
    p_right_jaw = pt(288)    # Góc hàm phải
    p_left_eye = pt(33)
    p_right_eye = pt(263)
    p_left_brow = pt(70)
    p_right_brow = pt(300)

    # 3. Tính toán hình học nhân trắc học (Anthropometric Calculations)
    face_length = float(np.linalg.norm(p_chin[:2] - p_forehead[:2]))
    cheek_width = float(np.linalg.norm(p_right_cheek[:2] - p_left_cheek[:2]))
    forehead_width = float(np.linalg.norm(p_right_brow[:2] - p_left_brow[:2]) * 1.55)
    jaw_width = float(np.linalg.norm(p_right_jaw[:2] - p_left_jaw[:2]) * 1.45)

    ratio_len_to_width = face_length / cheek_width if cheek_width > 0 else 1.3
    ratio_jaw_to_cheek = jaw_width / cheek_width if cheek_width > 0 else 0.8
    ratio_forehead_to_cheek = forehead_width / cheek_width if cheek_width > 0 else 0.8

    # Phân loại dáng mặt chuẩn nhân trắc học
    if ratio_len_to_width > 1.45:
        face_shape = "Mặt Dài (Oblong)"
        shape_code = "oblong"
        shape_desc = "Chiều dài khuôn mặt lớn hơn rõ rệt so với chiều rộng. Cần kiểu tóc có độ phồng 2 bên để cân bằng tỉ lệ."
        recommended = "Layer Texture Hàn Quốc"
    elif ratio_len_to_width < 1.15:
        face_shape = "Mặt Tròn (Round)"
        shape_code = "round"
        shape_desc = "Tỉ lệ dài và rộng gần tương đương, đường nét má tròn đầy. Cần kiểu tóc vuốt cao để tạo cảm giác khuôn mặt thanh thoát hơn."
        recommended = "Pompadour & Mid Fade"
    elif ratio_jaw_to_cheek > 0.88 and abs(forehead_width - jaw_width) / cheek_width < 0.15:
        face_shape = "Mặt Vuông Chữ Điền (Square)"
        shape_code = "square"
        shape_desc = "Góc hàm sắc nét nam tính, vòm trán rộng vững chãi. Phù hợp tuyệt đối với các kiểu tóc cổ điển rẽ ngôi."
        recommended = "Side Part 7/3 Cổ Điển"
    elif ratio_forehead_to_cheek > ratio_jaw_to_cheek + 0.15:
        face_shape = "Mặt Trái Tim (Heart)"
        shape_code = "heart"
        shape_desc = "Trán rộng, cằm nhọn V-line. Phù hợp các phom tóc mái rủ textured để thu hẹp vùng trán."
        recommended = "French Crop Textured"
    else:
        face_shape = "Mặt Trái Xoan (Oval)"
        shape_code = "oval"
        shape_desc = "Tỷ lệ vàng cân đối hoàn hảo chuẩn Á Đông, đường nét hài hòa. Phù hợp với hầu hết mọi kiểu tóc chuẩn salon."
        recommended = "Side Part 7/3 Cổ Điển"

    # 4. Phân tích sắc tố da thật (Skin Undertone Sampling)
    c1 = (int(lm[117].x * w), int(lm[117].y * h))
    c2 = (int(lm[346].x * w), int(lm[346].y * h))
    samples = []
    for cx, cy in [c1, c2]:
        if 0 <= cy < h and 0 <= cx < w:
            patch = img_bgr[max(0, cy-6):min(h, cy+6), max(0, cx-6):min(w, cx+6)]
            if patch.size > 0:
                samples.append(np.mean(patch, axis=(0, 1)))

    if samples:
        avg_bgr = np.mean(samples, axis=0)
        b_val, g_val, r_val = float(avg_bgr[0]), float(avg_bgr[1]), float(avg_bgr[2])
        if (r_val - b_val) > 35:
            undertone = "Sắc Tố Da Ấm (Warm Undertone)"
            best_hair_colors = ["Nâu Hạt Dẻ", "Nâu Lạnh Sâu", "Đen Tự Nhiên"]
        elif (r_val - b_val) < 20:
            undertone = "Sắc Tố Da Lạnh (Cool Undertone)"
            best_hair_colors = ["Xám Khói Titan", "Rêu Khói Ánh Xanh"]
        else:
            undertone = "Sắc Tố Da Trung Tính (Neutral Undertone)"
            best_hair_colors = ["Đen Tự Nhiên", "Nâu Lạnh Sâu", "Vàng Cát Trầm"]
    else:
        undertone = "Sắc Tố Da Ấm (Warm Undertone)"
        best_hair_colors = ["Đen Tự Nhiên", "Nâu Lạnh Sâu"]

    # 5. Điểm số tương thích từng kiểu tóc chuẩn Salon (đủ 12 kiểu)
    scores = {
        "sidepart-gentleman": 96 if shape_code in ["square", "oval"] else 86,
        "pompadour-luxury": 98 if shape_code in ["round", "square"] else 85,
        "layer-korean": 97 if shape_code in ["oblong", "oval", "heart"] else 86,
        "mullet-modern": 93 if shape_code in ["oval", "heart", "diamond"] else 82,
        "buzzcut-fade": 95 if shape_code in ["square", "oval"] else 78,
        "french-crop": 94 if shape_code in ["heart", "oblong", "oval"] else 83,
        "short-quiff": 96 if shape_code in ["round", "square", "oval"] else 85,
        "two-block": 97 if shape_code in ["round", "oval", "heart"] else 87,
        "ivy-league": 95 if shape_code in ["square", "oval", "round"] else 84,
        "undercut-slick": 94 if shape_code in ["square", "oblong", "oval"] else 81,
        "ripple-perm": 95 if shape_code in ["oblong", "oval", "diamond"] else 84,
        "mohican-fade": 93 if shape_code in ["round", "square"] else 80
    }

    # Góc nghiêng đầu (Roll) & Góc xoay ngang (Yaw)
    dy = p_right_eye[1] - p_left_eye[1]
    dx = p_right_eye[0] - p_left_eye[0]
    roll_angle = float(np.degrees(np.arctan2(dy, dx)))
    mid_cheek_x = (p_left_cheek[0] + p_right_cheek[0]) / 2.0
    nose_x = float(lm[1].x * w)
    yaw_ratio = (nose_x - mid_cheek_x) / max(cheek_width * 0.5, 1.0)
    yaw_angle = float(np.clip(yaw_ratio * 42.0, -45.0, 45.0))

    # Vẽ cung hộp sọ & viền hàm chuẩn hóa (Normalized Head & Face Overlay Points)
    hairline_arc = [
        {"x": round(float(lm[i].x), 4), "y": round(float(lm[i].y), 4)}
        for i in (54, 103, 67, 109, 10, 338, 297, 332, 284)
    ]
    jaw_contour = [
        {"x": round(float(lm[i].x), 4), "y": round(float(lm[i].y), 4)}
        for i in (234, 58, 172, 136, 150, 152, 379, 365, 397, 288, 454)
    ]
    skull_top_y_norm = max(0.02, float(p_forehead[1] / h) - float(face_length / h) * 0.48)

    result = {
        "success": True,
        "provider": "Python Vision Engine (MediaPipe 3D Face Mesh)",
        "faceShape": {
            "name": face_shape,
            "code": shape_code,
            "desc": shape_desc
        },
        "skinUndertone": {
            "name": undertone,
            "suggestedColors": best_hair_colors
        },
        "topMatch": {
            "name": recommended,
            "score": max(scores.values())
        },
        "styleScores": scores,
        "metrics": {
            "faceLengthPx": round(face_length, 1),
            "cheekWidthPx": round(cheek_width, 1),
            "ratioLengthToWidth": round(ratio_len_to_width, 2),
            "ratioJawToCheek": round(ratio_jaw_to_cheek, 2),
            "headRollDegrees": round(roll_angle, 1),
            "headYawDegrees": round(yaw_angle, 1),
            "landmarksDetected": len(lm)
        },
        "geometry": {
            "centerX": round(float(mid_cheek_x), 1),
            "foreheadY": round(float(p_forehead[1]), 1),
            "chinY": round(float(p_chin[1]), 1),
            "faceWidth": round(cheek_width, 1),
            "faceHeight": round(face_length, 1),
            "rollDegrees": round(roll_angle, 1),
            "yawDegrees": round(yaw_angle, 1),
            "normalized": {
                "centerX": round(float(mid_cheek_x / w), 4),
                "foreheadY": round(float(p_forehead[1] / h), 4),
                "chinY": round(float(p_chin[1] / h), 4),
                "skullTopY": round(skull_top_y_norm, 4),
                "eyebrowY": round(float(min(lm[70].y, lm[300].y)), 4),
                "leftCheekX": round(float(min(lm[234].x, lm[454].x)), 4),
                "rightCheekX": round(float(max(lm[234].x, lm[454].x)), 4),
                "faceWidth": round(float(cheek_width / w), 4),
                "faceHeight": round(float(face_length / h), 4),
                "hairlineArc": hairline_arc,
                "jawContour": jaw_contour
            }
        },
        "barberAdvice": f"Dựa trên phân tích 3D Face Mesh: Khuôn mặt của bạn thuộc nhóm {face_shape} với tỷ lệ dài/rộng là {ratio_len_to_width:.2f}. Kiểu tóc [{recommended}] sẽ là lựa chọn tối ưu nhất để tôn đường nét xương hàm và cân bằng vòm trán."
    }

    if include_assets:
        try:
            cropped_img = auto_crop_portrait(img_bgr, detector=detector, target_w=600, target_h=800)
            seg = get_segmenter()
            clean_base, bgra_cutout, _ = remove_background_and_old_hair(cropped_img, detector=detector, segmenter=seg, background_mode='studio')
            if cropped_img is not None:
                _, buf_c = cv2.imencode('.jpg', cropped_img, [cv2.IMWRITE_JPEG_QUALITY, 95])
                result["croppedImageUrl"] = f"data:image/jpeg;base64,{base64.b64encode(buf_c).decode('utf-8')}"
                try:
                    hc_i, wc_i = cropped_img.shape[:2]
                    mp_cr = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(cropped_img, cv2.COLOR_BGR2RGB))
                    det_cr = detector.detect(mp_cr)
                    if det_cr.face_landmarks:
                        lm_cr = det_cr.face_landmarks[0]
                        cr_forehead_y = float(lm_cr[10].y)
                        cr_chin_y = float(lm_cr[152].y)
                        cr_fh = abs(cr_chin_y - cr_forehead_y)
                        result["croppedGeometry"] = {
                            "normalized": {
                                "centerX": round(float((lm_cr[234].x + lm_cr[454].x) / 2.0), 4),
                                "foreheadY": round(cr_forehead_y, 4),
                                "chinY": round(cr_chin_y, 4),
                                "skullTopY": round(max(0.02, cr_forehead_y - cr_fh * 0.48), 4),
                                "eyebrowY": round(float(min(lm_cr[70].y, lm_cr[300].y)), 4),
                                "leftCheekX": round(float(min(lm_cr[234].x, lm_cr[454].x)), 4),
                                "rightCheekX": round(float(max(lm_cr[234].x, lm_cr[454].x)), 4),
                                "hairlineArc": [{"x": round(float(lm_cr[i].x), 4), "y": round(float(lm_cr[i].y), 4)} for i in (54, 103, 67, 109, 10, 338, 297, 332, 284)],
                                "jawContour": [{"x": round(float(lm_cr[i].x), 4), "y": round(float(lm_cr[i].y), 4)} for i in (234, 58, 172, 136, 150, 152, 379, 365, 397, 288, 454)]
                            }
                        }
                except Exception:
                    pass
            if clean_base is not None:
                _, buf_b = cv2.imencode('.jpg', clean_base, [cv2.IMWRITE_JPEG_QUALITY, 95])
                result["cleanBaseImageUrl"] = f"data:image/jpeg;base64,{base64.b64encode(buf_b).decode('utf-8')}"
            if bgra_cutout is not None:
                _, buf_t = cv2.imencode('.png', bgra_cutout)
                result["transparentPngUrl"] = f"data:image/png;base64,{base64.b64encode(buf_t).decode('utf-8')}"
            result["autoCropApplied"] = True
            result["backgroundRemoved"] = True
            result["oldHairRemoved"] = True
        except Exception:
            pass

    return result

# Cache for model hairstyle data and runtime MediaPipe singletons
_STYLE_CACHE = {}
_DETECTOR_CACHE = None
_SEGMENTER_CACHE = None

def get_detector():
    global _DETECTOR_CACHE
    if _DETECTOR_CACHE is not None:
        return _DETECTOR_CACHE
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(backend_dir, "face_landmarker.task")
    if not os.path.exists(model_path):
        model_path = os.path.join(backend_dir, "..", "..", "face_landmarker.task")
    base_options = python.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(base_options=base_options, num_faces=1)
    _DETECTOR_CACHE = vision.FaceLandmarker.create_from_options(options)
    return _DETECTOR_CACHE

def get_segmenter():
    global _SEGMENTER_CACHE
    if _SEGMENTER_CACHE is not None:
        return _SEGMENTER_CACHE
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    seg_model_path = os.path.join(backend_dir, "selfie_multiclass.tflite")
    if not os.path.exists(seg_model_path):
        seg_model_path = os.path.join(backend_dir, "..", "..", "selfie_multiclass.tflite")
    base_options = python.BaseOptions(model_asset_path=seg_model_path)
    options = vision.ImageSegmenterOptions(base_options=base_options, output_confidence_masks=True)
    _SEGMENTER_CACHE = vision.ImageSegmenter.create_from_options(options)
    return _SEGMENTER_CACHE

def auto_crop_portrait(img, detector=None, target_w=600, target_h=800):
    """
    Tự động nhận diện khuôn mặt và cắt ảnh chân dung theo khung chuẩn 3:4.
    Tối ưu khoảng cách trên đầu (Headroom) cho các kiểu tóc bồng bềnh và ôm trọn cổ/vai.
    """
    if img is None:
        return None
    h_orig, w_orig = img.shape[:2]
    
    if detector is None:
        detector = get_detector()

    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
    det = detector.detect(mp_img)
    if not det.face_landmarks:
        return cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)

    lm = det.face_landmarks[0]
    p_forehead = np.array([lm[10].x * w_orig, lm[10].y * h_orig])
    p_chin = np.array([lm[152].x * w_orig, lm[152].y * h_orig])
    p_lcheek = np.array([lm[234].x * w_orig, lm[234].y * h_orig])
    p_rcheek = np.array([lm[454].x * w_orig, lm[454].y * h_orig])

    face_h = float(np.linalg.norm(p_chin - p_forehead))
    if face_h <= 10:
        face_h = h_orig * 0.4
    center_x = float((p_lcheek[0] + p_rcheek[0]) / 2.0)

    # Khoảng cách phía trên đỉnh đầu (0.68 face height) và phía dưới cằm (0.92 face height)
    y_top = int(p_forehead[1] - face_h * 0.68)
    y_bottom = int(p_chin[1] + face_h * 0.92)
    crop_h = y_bottom - y_top
    crop_w = int(crop_h * 0.75)  # Tỉ lệ 3:4
    x_left = int(center_x - crop_w / 2.0)
    x_right = x_left + crop_w

    pad_top = max(0, -y_top)
    pad_bottom = max(0, y_bottom - h_orig)
    pad_left = max(0, -x_left)
    pad_right = max(0, x_right - w_orig)

    if pad_top > 0 or pad_bottom > 0 or pad_left > 0 or pad_right > 0:
        padded = cv2.copyMakeBorder(img, pad_top, pad_bottom, pad_left, pad_right, cv2.BORDER_REFLECT_101)
        y_top += pad_top
        y_bottom += pad_top
        x_left += pad_left
        x_right += pad_left
        cropped = padded[y_top:y_bottom, x_left:x_right]
    else:
        cropped = img[y_top:y_bottom, x_left:x_right]

    if cropped.size == 0 or cropped.shape[0] < 20 or cropped.shape[1] < 20:
        return cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)

    return cv2.resize(cropped, (target_w, target_h), interpolation=cv2.INTER_AREA)

def remove_background_and_old_hair(cropped_img, detector=None, segmenter=None, background_mode='studio'):
    """
    Tách nền và xử lý vùng tóc cũ trên ảnh chân dung.
    """
    if cropped_img is None:
        return None, None, None
    h, w = cropped_img.shape[:2]
    if detector is None:
        detector = get_detector()
    if segmenter is None:
        segmenter = get_segmenter()

    mp_crop = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(cropped_img, cv2.COLOR_BGR2RGB))
    det_c = detector.detect(mp_crop)
    if not det_c.face_landmarks:
        return cropped_img, None, cropped_img

    lm_c = det_c.face_landmarks[0]
    seg_c = segmenter.segment(mp_crop)

    bg_conf = seg_c.confidence_masks[0].numpy_view().reshape((h, w))
    hair_conf = seg_c.confidence_masks[1].numpy_view().reshape((h, w))
    body_conf = seg_c.confidence_masks[2].numpy_view().reshape((h, w))
    face_conf = seg_c.confidence_masks[3].numpy_view().reshape((h, w))
    clothes_conf = seg_c.confidence_masks[4].numpy_view().reshape((h, w))

    # Nền Studio sang trọng OmniSalon (Dark Editorial Gradient + Radial Spotlight)
    studio_bg = np.zeros_like(cropped_img)
    for y in range(h):
        r = y / float(h)
        val = int(22 * (1 - r) + 14 * r)
        studio_bg[y, :] = (val, val, val + 2)

    cx, cy = int(w * 0.5), int(h * 0.35)
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - cx)**2 + ((Y - cy) * 1.2)**2)
    spot = np.clip(1.0 - dist / (h * 0.65), 0, 1)
    studio_bg[:, :, 0] = np.clip(studio_bg[:, :, 0] + spot * 22, 0, 255)
    studio_bg[:, :, 1] = np.clip(studio_bg[:, :, 1] + spot * 26, 0, 255)
    studio_bg[:, :, 2] = np.clip(studio_bg[:, :, 2] + spot * 32, 0, 255)

    # Tính toán vòm hộp sọ (Cranium Dome)
    p_chin_c = np.array([lm_c[152].x * w, lm_c[152].y * h])
    p_forehead_c = np.array([lm_c[10].x * w, lm_c[10].y * h])
    p_lcheek_c = np.array([lm_c[234].x * w, lm_c[234].y * h])
    p_rcheek_c = np.array([lm_c[454].x * w, lm_c[454].y * h])

    face_vec = p_forehead_c - p_chin_c
    fh = np.linalg.norm(face_vec)
    if fh <= 0:
        fh = h * 0.4
    up = face_vec / fh
    cw = np.linalg.norm(p_rcheek_c - p_lcheek_c)

    skull_center = p_forehead_c + up * (fh * 0.05)
    rx = int(cw * 0.52)
    ry = int(fh * 0.40)
    ang = np.degrees(np.arctan2(up[1], up[0])) + 90

    skull_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.ellipse(skull_mask, (int(skull_center[0]), int(skull_center[1])), (rx, ry), ang, 180, 360, 255, -1)

    # Lấy mẫu màu da trán thật của khách
    sample_pts = [10, 67, 109, 297, 338]
    skin_samples = []
    for idx in sample_pts:
        sx = int(lm_c[idx].x * w)
        sy = int(lm_c[idx].y * h)
        patch = cropped_img[max(0, sy-3):min(h, sy+3), max(0, sx-3):min(w, sx+3)]
        if patch.size > 0:
            skin_samples.append(np.mean(patch, axis=(0, 1)))
    mean_skin = np.mean(skin_samples, axis=0) if skin_samples else np.array([160, 180, 210])

    # Tái tạo bề mặt da đầu (Scalp Skin) với hiệu ứng bóng khối vòm sọ 3D
    scalp_region = (skull_mask > 0) & (hair_conf > 0.20)
    scalp_img = np.zeros_like(cropped_img, dtype=np.float32)
    dome_shd = np.clip(1.0 - (dist / (rx * 1.3)) * 0.25, 0.72, 1.05)
    for c in range(3):
        scalp_img[:, :, c] = mean_skin[c] * dome_shd

    scalp_alpha = cv2.GaussianBlur(scalp_region.astype(np.float32), (15, 15), 0)
    eyebrow_min_y = int(min(lm_c[70].y, lm_c[300].y) * h)
    face_protect = (face_conf > 0.20).astype(np.float32)
    face_protect[:eyebrow_min_y - 10, :] = 0.0
    scalp_alpha = scalp_alpha * (1.0 - face_protect)

    person_body_face = np.clip(face_conf + body_conf + clothes_conf, 0.0, 1.0)
    body_face_alpha = cv2.GaussianBlur(person_body_face, (9, 9), 0)[:, :, None]

    canvas = studio_bg.astype(np.float32)
    canvas = canvas * (1.0 - scalp_alpha[:, :, None]) + scalp_img * scalp_alpha[:, :, None]
    clean_bald_base = canvas * (1.0 - body_face_alpha) + cropped_img.astype(np.float32) * body_face_alpha
    clean_bald_base = np.clip(clean_bald_base, 0, 255).astype(np.uint8)

    # Ảnh tách nền trong suốt (RGBA Cutout)
    person_all = np.clip(face_conf + body_conf + clothes_conf + scalp_alpha, 0.0, 1.0)
    person_alpha_u8 = (cv2.GaussianBlur(person_all, (7, 7), 0) * 255).astype(np.uint8)
    bgra = cv2.cvtColor(clean_bald_base, cv2.COLOR_BGR2BGRA)
    bgra[:, :, 3] = person_alpha_u8

    return clean_bald_base, bgra, cropped_img

def get_style_data(hairstyle_id, segmenter, detector):
    if hairstyle_id in _STYLE_CACHE:
        return _STYLE_CACHE[hairstyle_id]

    backend_dir = os.path.dirname(os.path.abspath(__file__))
    valid_styles = [
        'layer-korean', 'pompadour-luxury', 'mullet-modern', 'sidepart-gentleman', 
        'buzzcut-fade', 'french-crop', 'short-quiff', 'two-block', 
        'ivy-league', 'undercut-slick', 'ripple-perm', 'mohican-fade'
    ]
    if hairstyle_id not in valid_styles:
        # Map common aliases
        alias_map = {
            'pompadour': 'pompadour-luxury',
            'buzz-cut': 'buzzcut-fade',
            'buzzcut': 'buzzcut-fade',
            'mullet': 'mullet-modern',
            'sidepart': 'sidepart-gentleman',
            'quiff': 'short-quiff',
            'twoblock': 'two-block',
            'ivyleague': 'ivy-league',
            'undercut': 'undercut-slick',
            'slickback': 'undercut-slick',
            'ripple': 'ripple-perm',
            'con-sau': 'ripple-perm',
            'mohican': 'mohican-fade'
        }
        hairstyle_id = alias_map.get(hairstyle_id, 'layer-korean')

    target_path = os.path.join(backend_dir, 'hairstyles', f'{hairstyle_id}.jpg')
    if not os.path.exists(target_path):
        target_path = os.path.join(backend_dir, 'hairstyles', 'layer-korean.jpg')

    img_target = cv2.imread(target_path)
    if img_target is None:
        return None

    h_s, w_s = img_target.shape[:2]
    mp_style = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img_target, cv2.COLOR_BGR2RGB))

    # Segment hair confidence and skin confidence
    seg_style = segmenter.segment(mp_style)
    hair_conf_s = seg_style.confidence_masks[1].numpy_view().reshape((h_s, w_s))
    skin_conf_s = seg_style.confidence_masks[3].numpy_view().reshape((h_s, w_s))

    # Extract 3D face landmarks first so forehead bangs are preserved accurately
    det_s = detector.detect(mp_style)
    if not det_s.face_landmarks:
        return None
    lm_s = det_s.face_landmarks[0]

    # PURE HAIR FIBERS WITH FOREHEAD BANG PRESERVATION & FADE SKIN SEPARATION:
    # Above eyebrows inside central forehead, allow wispy bangs overlapping skin;
    # on cheeks/jaw and lateral temples above ears, remove bare studio skin cleanly so fade temples don't bleed pale skin patches.
    eyebrow_s_y = int(min(lm_s[70].y, lm_s[300].y) * h_s)
    bx0_s = max(0, int(min(lm_s[70].x, lm_s[105].x) * w_s))
    bx1_s = min(w_s, int(max(lm_s[300].x, lm_s[334].x) * w_s))
    cutoff_s = max(1, min(h_s - 1, eyebrow_s_y))

    skin_penalty = np.zeros_like(skin_conf_s, dtype=np.float32)
    skin_penalty[:cutoff_s, bx0_s:bx1_s] = np.clip((skin_conf_s[:cutoff_s, bx0_s:bx1_s] - 0.55) / 0.35, 0.0, 1.0)
    skin_penalty[:cutoff_s, :bx0_s] = np.clip((skin_conf_s[:cutoff_s, :bx0_s] - 0.14) / 0.26, 0.0, 1.0)
    skin_penalty[:cutoff_s, bx1_s:] = np.clip((skin_conf_s[:cutoff_s, bx1_s:] - 0.14) / 0.26, 0.0, 1.0)
    skin_penalty[cutoff_s:, :] = np.clip((skin_conf_s[cutoff_s:, :] - 0.08) / 0.22, 0.0, 1.0)

    # Attenuate bright warm bare-skin studio fade areas on dark-haired templates so bare temple skin stays below solid core threshold
    lab_tpl = cv2.cvtColor(img_target, cv2.COLOR_BGR2LAB).astype(np.float32)
    dark_core_px = (hair_conf_s > 0.72) & (skin_conf_s < 0.08)
    core_med_l = float(np.median(lab_tpl[:, :, 0][dark_core_px])) if np.sum(dark_core_px) > 100 else 30.0
    if core_med_l < 85.0:
        b_ch, _, r_ch = cv2.split(img_target.astype(np.float32))
        warm_bare_skin = (
            np.clip((lab_tpl[:, :, 0] - 88.0) / 26.0, 0.0, 1.0)
            * np.clip((r_ch - b_ch - 10.0) / 14.0, 0.0, 1.0)
            * np.clip((lab_tpl[:, :, 1] - 129.0) / 5.0, 0.0, 1.0)
        )
        # Apply on temple height & below forehead top (preserve upper crown specular strands)
        top_fh_y = max(0, int(lm_s[10].y * h_s))
        warm_bare_skin[:top_fh_y, bx0_s:bx1_s] = 0.0
        skin_penalty = np.maximum(skin_penalty, warm_bare_skin * 0.72)

    skin_penalty = cv2.GaussianBlur(skin_penalty, (9, 9), 0)

    pure_hair_s = hair_conf_s * (1.0 - skin_penalty)
    hair_alpha = np.clip((pure_hair_s - 0.22) / 0.50, 0.0, 1.0)

    # Color Spill Decontamination: replace semi-transparent edge pixels' studio backdrop
    # with neutral-capped interior hair RGB so warping never creates a pale halo outline.
    decontam_img = decontaminate_hair_foreground(img_target, hair_alpha)

    data = {
        'img': decontam_img,
        'raw_img': img_target,
        'hair_alpha': hair_alpha,
        'lm': lm_s,
        'shape': (h_s, w_s)
    }
    _STYLE_CACHE[hairstyle_id] = data
    return data

def decontaminate_hair_foreground(img_bgr, hair_alpha):
    """
    Khử viền tối/sáng nền (Foreground Color Spill Decontamination):
    Ngoại suy màu sợi tóc thuần khiết từ vùng lõi tóc nhưng giới hạn độ sáng viền ngoài
    để tránh quầng sáng trắng quanh mép đầu khi ghép lên phông nền tối hoặc cảnh thật.
    """
    core = (hair_alpha > 0.76).astype(np.float32)
    if np.sum(core) < 40:
        return img_bgr

    img_f = img_bgr.astype(np.float32)
    num = img_f * core[:, :, None]
    extrap = img_f.copy()

    for k in (45, 21, 9):
        b_num = cv2.GaussianBlur(num, (k, k), 0)
        b_den = cv2.GaussianBlur(core, (k, k), 0)
        valid = b_den > 1e-4
        est = b_num / np.maximum(b_den[:, :, None], 1e-4)
        extrap[valid] = est[valid]

    # Clamp exterior extrapolated luminance to core median so specular top highlights never bleed into a pale halo
    lab_raw = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB).astype(np.float32)
    core_med_l = float(np.median(lab_raw[:, :, 0][core > 0.5]))
    extrap_u8 = np.clip(extrap, 0, 255).astype(np.uint8)
    lab_ext = cv2.cvtColor(extrap_u8, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab_ext[:, :, 0] = np.minimum(lab_ext[:, :, 0], core_med_l * 1.02 + 4.0)
    extrap = cv2.cvtColor(np.clip(lab_ext, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)

    keep_interior = np.clip((hair_alpha - 0.58) / 0.24, 0.0, 1.0)[:, :, None]
    clean_fg = img_f * keep_interior + extrap * (1.0 - keep_interior)
    return np.clip(clean_fg, 0, 255).astype(np.uint8)

def get_skull_anchors(lm, w, h, volume='standard'):
    """
    Trích xuất lưới điểm mốc nhân trắc học cong tròn 3D theo vòm sọ:
    - Bù góc nghiêng đầu (Roll), góc xoay ngang (Yaw 3D) và tỉ lệ bề ngang xương gò má thật.
    - Điều chỉnh độ phồng (volume: natural / standard / high) ôm sát form đầu.
    """
    pts = []
    # 17 điểm mốc nhân trắc học thật từ MediaPipe (giới hạn an toàn trong kích thước ảnh)
    indices = [10, 67, 109, 297, 338, 21, 54, 103, 251, 284, 332, 33, 263, 168, 234, 454, 152]
    max_x = max(0.0, float(w - 1))
    max_y = max(0.0, float(h - 1))
    for idx in indices:
        px = float(np.clip(lm[idx].x * w, 0.0, max_x))
        py = float(np.clip(lm[idx].y * h, 0.0, max_y))
        pts.append([px, py])

    p_chin = np.array([lm[152].x * w, lm[152].y * h], dtype=np.float32)
    p_forehead = np.array([lm[10].x * w, lm[10].y * h], dtype=np.float32)
    p_lcheek = np.array([lm[234].x * w, lm[234].y * h], dtype=np.float32)
    p_rcheek = np.array([lm[454].x * w, lm[454].y * h], dtype=np.float32)
    p_nose = np.array([lm[1].x * w, lm[1].y * h], dtype=np.float32)

    face_vec = p_forehead - p_chin
    face_h = float(np.linalg.norm(face_vec))
    if face_h <= 0:
        face_h = 100.0
        up_vec = np.array([0.0, -1.0], dtype=np.float32)
    else:
        up_vec = face_vec / face_h

    right_vec = np.array([-up_vec[1], up_vec[0]], dtype=np.float32)
    p_bridge = np.array([lm[168].x * w, lm[168].y * h], dtype=np.float32)
    cheek_w = max(40.0, float(np.linalg.norm(p_rcheek - p_lcheek)))
    mid_cheek = (p_lcheek + p_rcheek) * 0.5
    yaw_factor = float(np.clip(np.dot(p_nose - mid_cheek, right_vec) / max(cheek_w * 0.5, 20.0), -0.45, 0.45))

    vol_map = {
        'natural': (0.46, 0.56),
        'standard': (0.51, 0.61),
        'high': (0.59, 0.68),
    }
    rx_k, ry_k = vol_map.get(volume, vol_map['standard'])
    half_width_span = max(face_h * rx_k, cheek_w * 0.58)
    scale_l = 1.0 + 0.16 * max(0.0, yaw_factor) - 0.30 * max(0.0, -yaw_factor)
    scale_r = 1.0 + 0.16 * max(0.0, -yaw_factor) - 0.30 * max(0.0, yaw_factor)

    # Cung elip 7 điểm ôm tròn vòm sọ theo đúng hướng quay 3D của đầu
    arc_center = p_forehead - up_vec * (face_h * 0.06) - right_vec * (yaw_factor * face_h * 0.10)
    for deg in (-68.0, -45.0, -22.0, 0.0, 22.0, 45.0, 68.0):
        rad = np.radians(deg)
        sin_val = float(np.sin(rad))
        side_scale = scale_l if sin_val < 0 else scale_r
        pt = arc_center + right_vec * (half_width_span * side_scale * sin_val) + up_vec * (face_h * ry_k * np.cos(rad))
        pts.append([float(np.clip(pt[0], 0, max_x)), float(np.clip(pt[1], 0, max_y))])

    # 2 điểm neo vùng mang tai / gáy dưới cân xứng theo góc xoay đầu
    nape_span = max(face_h * 0.54, cheek_w * 0.58)
    nape_l = p_bridge - up_vec * (face_h * 0.42) - right_vec * (nape_span * scale_l)
    nape_r = p_bridge - up_vec * (face_h * 0.42) + right_vec * (nape_span * scale_r)
    pts.append([float(np.clip(nape_l[0], 0, max_x)), float(np.clip(nape_l[1], 0, max_y))])
    pts.append([float(np.clip(nape_r[0], 0, max_x)), float(np.clip(nape_r[1], 0, max_y))])

    # 8 điểm neo cố định khung viền ảnh (Image Boundary Anchors)
    pts.append([0.0, 0.0])
    pts.append([max_x, 0.0])
    pts.append([0.0, max_y])
    pts.append([max_x, max_y])
    pts.append([float(w // 2), 0.0])
    pts.append([0.0, float(h // 2)])
    pts.append([max_x, float(h // 2)])
    pts.append([float(w // 2), max_y])
    return np.array(pts, dtype=np.float32)

def piecewise_delaunay_warp(style_img, style_alpha, pts_s, pts_c, w_c, h_c):
    """
    Biến dạng tóc đa điểm phi tuyến tính bằng phân rã tam giác Delaunay (Piecewise Affine Warping).
    Tóc mẫu sẽ uốn lượn và ôm sát từng góc cạnh sọ đầu của khách hàng thay vì co giãn phẳng.
    """
    rect = (0, 0, w_c, h_c)
    subdiv = cv2.Subdiv2D(rect)
    max_x = max(0.0, float(w_c - 1))
    max_y = max(0.0, float(h_c - 1))
    pts_c = np.asarray(pts_c, dtype=np.float32).copy()
    pts_c[:, 0] = np.clip(pts_c[:, 0], 0.0, max_x)
    pts_c[:, 1] = np.clip(pts_c[:, 1], 0.0, max_y)
    for p in pts_c:
        px, py = float(p[0]), float(p[1])
        if np.isfinite(px) and np.isfinite(py) and 0.0 <= px < w_c and 0.0 <= py < h_c:
            try:
                subdiv.insert((px, py))
            except cv2.error:
                pass

    t_list = subdiv.getTriangleList()
    warped_style = np.zeros((h_c, w_c, 3), dtype=np.uint8)
    warped_alpha = np.zeros((h_c, w_c), dtype=np.float32)

    for t in t_list:
        pts_dst_tri = np.array([[t[0], t[1]], [t[2], t[3]], [t[4], t[5]]], dtype=np.float32)
        if (pts_dst_tri[:, 0] < 0).any() or (pts_dst_tri[:, 0] >= w_c).any() or (pts_dst_tri[:, 1] < 0).any() or (pts_dst_tri[:, 1] >= h_c).any():
            continue

        idx_list = []
        for pt in pts_dst_tri:
            dists = np.sum((pts_c - pt) ** 2, axis=1)
            idx_list.append(np.argmin(dists))

        pts_src_tri = pts_s[idx_list]
        r_dst = cv2.boundingRect(pts_dst_tri)
        r_src = cv2.boundingRect(pts_src_tri)

        if r_dst[2] <= 0 or r_dst[3] <= 0 or r_src[2] <= 0 or r_src[3] <= 0:
            continue

        t1_crop = pts_src_tri - np.array([r_src[0], r_src[1]], dtype=np.float32)
        t2_crop = pts_dst_tri - np.array([r_dst[0], r_dst[1]], dtype=np.float32)

        mask = np.zeros((r_dst[3], r_dst[2]), dtype=np.float32)
        cv2.fillConvexPoly(mask, np.int32(t2_crop), 1.0, 16, 0)

        M = cv2.getAffineTransform(t1_crop, t2_crop)
        src_crop = style_img[r_src[1]:r_src[1] + r_src[3], r_src[0]:r_src[0] + r_src[2]]
        alpha_crop = style_alpha[r_src[1]:r_src[1] + r_src[3], r_src[0]:r_src[0] + r_src[2]]

        if src_crop.shape[0] == 0 or src_crop.shape[1] == 0:
            continue

        warped_crop = cv2.warpAffine(src_crop, M, (r_dst[2], r_dst[3]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        warped_a_crop = cv2.warpAffine(alpha_crop, M, (r_dst[2], r_dst[3]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)

        mask3 = mask[:, :, np.newaxis]
        target_area = warped_style[r_dst[1]:r_dst[1] + r_dst[3], r_dst[0]:r_dst[0] + r_dst[2]]
        warped_style[r_dst[1]:r_dst[1] + r_dst[3], r_dst[0]:r_dst[0] + r_dst[2]] = (target_area * (1.0 - mask3) + warped_crop * mask3).astype(np.uint8)

        target_a = warped_alpha[r_dst[1]:r_dst[1] + r_dst[3], r_dst[0]:r_dst[0] + r_dst[2]]
        warped_alpha[r_dst[1]:r_dst[1] + r_dst[3], r_dst[0]:r_dst[0] + r_dst[2]] = target_a * (1.0 - mask) + warped_a_crop * mask

    return warped_style, warped_alpha

def synthesize_forehead_shadow(hair_alpha, face_conf_c, lm_c, w_c, h_c):
    """
    Tạo bóng đổ tiếp xúc tự nhiên ở chân tóc tiếp giáp phần trán (Ambient Contact Shadow).
    """
    hair_thresh = (hair_alpha > 0.38).astype(np.uint8) * 255
    M_down = np.float32([[1, 0, 0], [0, 1, 3]])
    shadow_shifted = cv2.warpAffine(hair_thresh, M_down, (w_c, h_c))
    shadow_zone = cv2.subtract(shadow_shifted, hair_thresh)

    skin_mask = (face_conf_c > 0.25).astype(np.uint8) * 255
    shadow_zone = cv2.bitwise_and(shadow_zone, skin_mask)

    eyebrow_min_y = max(1, int(min(lm_c[70].y, lm_c[300].y) * h_c) - 4)
    shadow_zone[eyebrow_min_y:, :] = 0

    shadow_soft = cv2.GaussianBlur(shadow_zone, (13, 13), 4).astype(np.float32) / 255.0
    return np.clip(shadow_soft * 0.14, 0.0, 0.16)

def build_ear_protect_mask(lm_c, face_conf_c, body_conf_c, hair_conf_c, w_c, h_c, hairstyle_id):
    """
    Bảo vệ đôi tai thật của khách hàng cho các kiểu tóc cạo fade / cắt gọn 2 bên.
    """
    short_side_styles = ['buzzcut-fade', 'mohican-fade', 'undercut-slick', 'short-quiff', 'ivy-league', 'french-crop', 'pompadour-luxury']
    if hairstyle_id not in short_side_styles:
        return np.zeros((h_c, w_c), dtype=np.float32)

    p_chin = np.array([lm_c[152].x * w_c, lm_c[152].y * h_c], dtype=np.float32)
    p_forehead = np.array([lm_c[10].x * w_c, lm_c[10].y * h_c], dtype=np.float32)
    face_h = max(60.0, float(np.linalg.norm(p_chin - p_forehead)))
    rx = max(10, int(face_h * 0.11))
    ry = max(16, int(face_h * 0.15))

    ear_mask = np.zeros((h_c, w_c), dtype=np.uint8)
    for idx, x_dir in [(234, -1.0), (454, 1.0)]:
        ex = int(np.clip(lm_c[idx].x * w_c + x_dir * face_h * 0.04, 0, w_c - 1))
        ey = int(np.clip(lm_c[idx].y * h_c + face_h * 0.02, 0, h_c - 1))
        cv2.ellipse(ear_mask, (ex, ey), (rx, ry), 0, 0, 360, 255, -1)

    ear_skin = (((face_conf_c > 0.16) | (body_conf_c > 0.16)) & (hair_conf_c < 0.35)).astype(np.float32)
    ear_soft = (cv2.GaussianBlur(ear_mask, (15, 15), 0).astype(np.float32) / 255.0) * ear_skin
    return np.clip(ear_soft, 0.0, 1.0)

def inpaint_old_hair_natural(img_cust, hair_conf_c, face_conf_c, bg_conf_c, body_conf_c, clothes_conf_c, warped_alpha, lm_c, w_c, h_c):
    """
    Tẩy sạch tóc cũ tự nhiên trên ảnh thật của khách hàng:
    1. Tái tạo vùng da trán/thái dương lộ ra (nếu tóc mới ngắn/vuốt lên) mượt mà theo sắc tố da vùng mắt-trán.
    2. Tẩy toàn bộ tóc cũ thừa từ đỉnh đầu, hai bên thái dương xuống đến gáy Mullet sau cổ, giữ hậu cảnh gốc tự nhiên.
    """
    canvas = img_cust.astype(np.float32).copy()

    # Bảo vệ chính xác đôi chân mày theo đa giác (tránh cắt ngang phẳng gây vệt đen trên lông mày)
    eb_l = np.array([[lm_c[i].x * w_c, lm_c[i].y * h_c] for i in (70, 63, 105, 66, 107, 55, 65, 52, 53, 46)], dtype=np.int32)
    eb_r = np.array([[lm_c[i].x * w_c, lm_c[i].y * h_c] for i in (300, 293, 334, 296, 336, 285, 295, 282, 283, 276)], dtype=np.int32)
    eyebrow_protect = np.zeros((h_c, w_c), dtype=np.uint8)
    cv2.fillPoly(eyebrow_protect, [eb_l, eb_r], 255)
    eyebrow_protect = cv2.dilate(eyebrow_protect, np.ones((5, 5), np.uint8), iterations=1)

    eyebrow_min_y = max(2, int(min(lm_c[70].y, lm_c[300].y) * h_c))
    lip_top_y = min(h_c - 1, int(lm_c[13].y * h_c))
    forehead_top_y = int(lm_c[10].y * h_c)
    chin_y = int(lm_c[152].y * h_c)
    face_h = max(40.0, float(abs(chin_y - forehead_top_y)))

    # Vùng bảo vệ gương mặt lõi (cắt dưới mí mắt trên, giữ chân mày bằng đa giác cong để không tạo ngấn ngang trên trán)
    upper_eyelid_y = max(eyebrow_min_y + 2, int(min(lm_c[159].y, lm_c[386].y) * h_c))
    lower_face_protect = ((face_conf_c > 0.42) & (hair_conf_c < 0.14)).astype(np.uint8) * 255
    lower_face_protect[:upper_eyelid_y, :] = 0
    lower_face_protect = cv2.bitwise_or(lower_face_protect, eyebrow_protect)
    body_clothes_protect = (((body_conf_c > 0.42) | (clothes_conf_c > 0.42)) & (hair_conf_c < 0.16)).astype(np.uint8) * 255

    # Tạo mặt nạ loại trừ hốc mắt / chân mày khi lấy mẫu màu da thật
    eye_socket_mask = np.zeros((h_c, w_c), dtype=np.uint8)
    for ep in ([33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
               [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]):
        pts_e = np.array([[lm_c[i].x * w_c, lm_c[i].y * h_c] for i in ep], dtype=np.int32)
        cv2.fillPoly(eye_socket_mask, [pts_e], 255)
    eye_socket_mask = cv2.dilate(eye_socket_mask, np.ones((19, 19), np.uint8), iterations=1)
    eye_socket_mask = cv2.bitwise_or(eye_socket_mask, cv2.dilate(eyebrow_protect, np.ones((9, 9), np.uint8), iterations=1))

    # Lấy mẫu sắc tố da trán & gò má trên thuần khiết (co biên tránh xa vùng bóng tối sát tóc mái & hốc mắt)
    nose_tip_y = min(h_c - 1, int(lm_c[1].y * h_c))
    hair_free_erosion = cv2.erode((hair_conf_c < 0.03).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)), iterations=1)
    skin_seed_mask = ((face_conf_c > 0.72) & (hair_free_erosion > 0) & (bg_conf_c < 0.05)).astype(np.float32)
    skin_seed_mask[nose_tip_y:, :] = 0.0
    skin_seed_mask[eye_socket_mask > 0] = 0.0

    bare_forehead_seed = skin_seed_mask.copy()
    bare_forehead_seed[upper_eyelid_y:, :] = 0.0
    if np.sum(bare_forehead_seed > 0) > 25:
        median_skin = np.percentile(img_cust[bare_forehead_seed > 0], 62, axis=0).astype(np.float32)
    elif np.sum(skin_seed_mask > 0) > 60:
        median_skin = np.percentile(img_cust[skin_seed_mask > 0], 55, axis=0).astype(np.float32)
    else:
        median_skin = np.array([135.0, 155.0, 185.0], dtype=np.float32)

    # Ngoại suy mượt không tạo ranh giới bước nhảy (Soft Weighted Harmonic Propagation)
    skin_extrap = np.broadcast_to(median_skin[None, None, :], (h_c, w_c, 3)).astype(np.float32).copy()
    num_s = canvas * skin_seed_mask[:, :, None]
    for k in (55, 25, 11):
        b_num_s = cv2.GaussianBlur(num_s, (k, k), 0)
        b_den_s = cv2.GaussianBlur(skin_seed_mask, (k, k), 0)
        w_s = np.clip((b_den_s - 0.02) / 0.35, 0.0, 1.0)[:, :, None]
        est_s = b_num_s / np.maximum(b_den_s[:, :, None], 1e-4)
        skin_extrap = skin_extrap * (1.0 - w_s) + est_s * w_s

    skin_extrap = skin_extrap * 0.85 + median_skin[None, None, :] * 0.15
    skin_extrap = np.clip(skin_extrap + np.random.default_rng(7).normal(0.0, 1.8, size=(h_c, w_c, 3)).astype(np.float32), 0, 255)

    # 1. Tái tạo trán và vùng thái dương trên lộ ra khi đổi từ tóc mái dài sang kiểu vuốt ngược (Pompadour/Quiff/Ivy)
    temple_lift = int(face_h * 0.28)
    forehead_poly = np.array([
        [lm_c[127].x * w_c, max(0, lm_c[127].y * h_c - face_h * 0.04)],
        [lm_c[162].x * w_c, lm_c[162].y * h_c],
        [lm_c[21].x * w_c, max(0, lm_c[21].y * h_c - temple_lift * 0.35)],
        [lm_c[54].x * w_c, max(0, lm_c[54].y * h_c - temple_lift * 0.65)],
        [lm_c[103].x * w_c, max(0, lm_c[103].y * h_c - temple_lift * 0.90)],
        [lm_c[67].x * w_c, max(0, lm_c[67].y * h_c - temple_lift)],
        [lm_c[109].x * w_c, max(0, lm_c[109].y * h_c - temple_lift)],
        [lm_c[10].x * w_c, max(0, lm_c[10].y * h_c - temple_lift)],
        [lm_c[338].x * w_c, max(0, lm_c[338].y * h_c - temple_lift)],
        [lm_c[297].x * w_c, max(0, lm_c[297].y * h_c - temple_lift)],
        [lm_c[332].x * w_c, max(0, lm_c[332].y * h_c - temple_lift * 0.90)],
        [lm_c[284].x * w_c, max(0, lm_c[284].y * h_c - temple_lift * 0.65)],
        [lm_c[251].x * w_c, max(0, lm_c[251].y * h_c - temple_lift * 0.35)],
        [lm_c[389].x * w_c, lm_c[389].y * h_c],
        [lm_c[356].x * w_c, max(0, lm_c[356].y * h_c - face_h * 0.04)],
        [lm_c[300].x * w_c, lm_c[300].y * h_c],
        [lm_c[276].x * w_c, lm_c[276].y * h_c],
        [lm_c[283].x * w_c, lm_c[283].y * h_c],
        [lm_c[282].x * w_c, lm_c[282].y * h_c],
        [lm_c[295].x * w_c, lm_c[295].y * h_c],
        [lm_c[285].x * w_c, lm_c[285].y * h_c],
        [lm_c[336].x * w_c, lm_c[336].y * h_c],
        [lm_c[9].x * w_c, lm_c[9].y * h_c],
        [lm_c[107].x * w_c, lm_c[107].y * h_c],
        [lm_c[55].x * w_c, lm_c[55].y * h_c],
        [lm_c[65].x * w_c, lm_c[65].y * h_c],
        [lm_c[52].x * w_c, lm_c[52].y * h_c],
        [lm_c[53].x * w_c, lm_c[53].y * h_c],
        [lm_c[46].x * w_c, lm_c[46].y * h_c],
        [lm_c[70].x * w_c, lm_c[70].y * h_c],
    ], dtype=np.int32)
    forehead_region = np.zeros((h_c, w_c), dtype=np.uint8)
    cv2.fillPoly(forehead_region, [forehead_poly], 255)
    forehead_region[eyebrow_protect > 0] = 0
    forehead_region[lower_face_protect > 0] = 0

    old_bangs_exposed = ((forehead_region > 0) & (hair_conf_c > 0.10) & (warped_alpha < 0.78))
    if np.sum(old_bangs_exposed) > 20:
        bang_dil = cv2.dilate(old_bangs_exposed.astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)), iterations=1)
        bang_dil[eyebrow_protect > 0] = 0
        bang_dil[lower_face_protect > 0] = 0
        eb_soft_mask = 1.0 - (cv2.GaussianBlur(eyebrow_protect.astype(np.float32) / 255.0, (5, 5), 0))
        bang_feather = cv2.GaussianBlur(bang_dil.astype(np.float32) / 255.0, (17, 17), 0)
        bang_blend = np.maximum(bang_feather, old_bangs_exposed.astype(np.float32)) * eb_soft_mask
        bang_blend = bang_blend[:, :, None]
        canvas = canvas * (1.0 - bang_blend) + skin_extrap * bang_blend

    # 2. Tẩy sạch toàn bộ tóc cũ thừa ngoài hộp sọ (búi tóc cao, mai xù ngoài tường & đuôi gáy Mullet sau cổ),
    #    đồng thời không làm hỏng nền có chi tiết như poster/nội thất phòng.
    p_lcheek = np.array([lm_c[234].x * w_c, lm_c[234].y * h_c], dtype=np.float32)
    p_rcheek = np.array([lm_c[454].x * w_c, lm_c[454].y * h_c], dtype=np.float32)
    p_chin = np.array([lm_c[152].x * w_c, lm_c[152].y * h_c], dtype=np.float32)
    p_forehead = np.array([lm_c[10].x * w_c, lm_c[10].y * h_c], dtype=np.float32)
    up_v = p_forehead - p_chin
    up_v = up_v / max(float(np.linalg.norm(up_v)), 1.0)
    right_v = np.array([-up_v[1], up_v[0]], dtype=np.float32)
    cheek_span = max(40.0, float(np.linalg.norm(p_rcheek - p_lcheek)))
    cran_rx = max(face_h * 0.48, cheek_span * 0.54)
    cran_ry = face_h * 0.48
    cran_center = p_forehead - up_v * (face_h * 0.08)

    cranium_pts = [p_lcheek.astype(np.int32)]
    for deg in np.linspace(-82.0, 82.0, 15):
        rad = np.radians(deg)
        pt = cran_center + right_v * (cran_rx * np.sin(rad)) + up_v * (cran_ry * np.cos(rad))
        cranium_pts.append([int(np.clip(pt[0], 0, w_c - 1)), int(np.clip(pt[1], 0, h_c - 1))])
    cranium_pts.append(p_rcheek.astype(np.int32))

    # Chỉ giữ phần thái dương/tóc mai sát tai thấp (tránh giữ mái/tóc búi cũ nhô ra dưới tóc mới)
    skull_temple_zone = np.zeros((h_c, w_c), dtype=np.uint8)
    cv2.fillPoly(skull_temple_zone, [np.array(cranium_pts, dtype=np.int32)], 255)
    cheek_top_y = min(h_c - 1, int(min(lm_c[234].y, lm_c[454].y) * h_c))
    ear_bottom_y = min(h_c - 1, int(max(lm_c[234].y, lm_c[454].y) * h_c + face_h * 0.06))
    skull_temple_zone[:cheek_top_y, :] = 0
    skull_temple_zone[ear_bottom_y:, :] = 0

    old_hair_region = ((hair_conf_c > 0.12) & (warped_alpha < 0.72) & (forehead_region == 0) & ((bg_conf_c > 0.16) | (skull_temple_zone == 0)))
    outer_mask = old_hair_region.astype(np.uint8) * 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))
    outer_mask = cv2.dilate(outer_mask, kernel, iterations=1)
    outer_mask[(skull_temple_zone > 0) & (bg_conf_c < 0.16) & (warped_alpha < 0.15)] = 0
    outer_mask[lower_face_protect > 0] = 0
    outer_mask[body_clothes_protect > 0] = 0
    outer_mask[warped_alpha > 0.80] = 0

    # Vùng thái dương giải phẫu thuộc khung mặt dưới trán: tuyệt đối không mở rộng lên không trung trên đỉnh đầu
    head_skin_poly = np.array([
        [lm_c[234].x * w_c, lm_c[234].y * h_c],
        [lm_c[127].x * w_c, lm_c[127].y * h_c],
        [lm_c[54].x * w_c, lm_c[54].y * h_c],
        [lm_c[10].x * w_c, lm_c[10].y * h_c],
        [lm_c[284].x * w_c, lm_c[284].y * h_c],
        [lm_c[356].x * w_c, lm_c[356].y * h_c],
        [lm_c[454].x * w_c, lm_c[454].y * h_c],
    ], dtype=np.int32)
    inner_head_zone = np.zeros((h_c, w_c), dtype=np.uint8)
    cv2.fillPoly(inner_head_zone, [head_skin_poly], 255)
    inner_head_zone[bg_conf_c > 0.28] = 0
    inner_head_soft = cv2.GaussianBlur((inner_head_zone > 0).astype(np.float32), (9, 9), 0)

    if np.sum(outer_mask > 0) > 25:
        canvas_u8 = np.clip(canvas, 0, 255).astype(np.uint8)
        bg_seed = ((bg_conf_c > 0.60) & (outer_mask == 0) & (hair_conf_c < 0.12) & (face_conf_c < 0.10) & (body_conf_c < 0.10) & (clothes_conf_c < 0.10)).astype(np.float32)

        if np.sum(bg_seed > 0) > 150:
            bg_gray = cv2.cvtColor(canvas_u8, cv2.COLOR_BGR2GRAY).astype(np.float32)
            bg_hp = bg_gray - cv2.GaussianBlur(bg_gray, (7, 7), 0)
            bg_edge_energy = float(np.mean(np.abs(bg_hp[bg_seed > 0])))

            if bg_edge_energy > 3.6:
                bg_only_mask = outer_mask.copy()
                bg_only_mask[(face_conf_c > 0.35) | (inner_head_zone > 0)] = 0
                inpainted_bg = cv2.inpaint(canvas_u8, bg_only_mask, 9, cv2.INPAINT_TELEA).astype(np.float32)
                bg_extrap = inpainted_bg
            else:
                mean_bg = np.median(canvas_u8[bg_seed > 0], axis=0).astype(np.float32)
                bg_extrap = np.broadcast_to(mean_bg[None, None, :], (h_c, w_c, 3)).astype(np.float32).copy()
                num_b = canvas * bg_seed[:, :, None]
                for k in (121, 61, 25, 9):
                    b_num_b = cv2.GaussianBlur(num_b, (k, k), 0)
                    b_den_b = cv2.GaussianBlur(bg_seed, (k, k), 0)
                    valid_b = b_den_b > 0.02
                    est_b = b_num_b / np.maximum(b_den_b[:, :, None], 1e-4)
                    bg_extrap[valid_b] = est_b[valid_b]

                noise_std = float(np.clip(np.std(bg_hp[bg_seed > 0]) * 0.65, 0.0, 2.4))
                if noise_std > 0.25:
                    bg_extrap = np.clip(bg_extrap + np.random.default_rng(42).normal(0.0, noise_std, size=(h_c, w_c, 1)).astype(np.float32), 0, 255)

            face_skin_only = np.clip((face_conf_c - bg_conf_c) / 0.35, 0.0, 1.0) * (face_conf_c > 0.15).astype(np.float32)
            skin_side_w = np.maximum(
                face_skin_only,
                inner_head_soft * (bg_conf_c < 0.35).astype(np.float32)
            )[:, :, None]
            skin_side_w[bg_conf_c > 0.35] = 0.0
            fill_target = bg_extrap * (1.0 - skin_side_w) + skin_extrap * skin_side_w

            outer_core = (outer_mask > 0).astype(np.float32)
            outer_feather = cv2.GaussianBlur(outer_core, (11, 11), 0)
            outer_blend = np.maximum(outer_feather, outer_core)[:, :, None]
            canvas = canvas * (1.0 - outer_blend) + fill_target * outer_blend
        else:
            inpainted = cv2.inpaint(canvas_u8, outer_mask, 8, cv2.INPAINT_NS)
            soft_m = np.maximum(cv2.GaussianBlur(outer_mask.astype(np.float32) / 255.0, (9, 9), 0), (outer_mask > 0).astype(np.float32))[:, :, None]
            canvas = inpainted.astype(np.float32) * soft_m + canvas * (1.0 - soft_m)

    return np.clip(canvas, 0, 255).astype(np.uint8)

def clean_old_hair_background(img_cust, bg_conf_c, hair_conf_c, face_conf_c, warped_alpha, lm_c, w_c, h_c):
    """Chỉ dọn các sợi tóc tơ lẻ tẻ ngoài nền trời/tường (tránh chạm vùng cổ/vai đã ngoại suy nền)."""
    outer_flyaway = (hair_conf_c > 0.35) & (warped_alpha < 0.12) & (bg_conf_c > 0.60) & (face_conf_c < 0.08)

    base_canvas = img_cust.copy()
    if np.sum(outer_flyaway) > 35:
        dilated = cv2.dilate(outer_flyaway.astype(np.uint8) * 255, np.ones((5, 5), np.uint8), iterations=1)
        dilated[(face_conf_c > 0.08) | (bg_conf_c < 0.45)] = 0
        dilated[warped_alpha > 0.25] = 0
        if np.sum(dilated > 0) > 25:
            base_canvas = cv2.inpaint(base_canvas, dilated, 4, cv2.INPAINT_TELEA)
    return base_canvas

def reinhard_color_adaptation(warped_style, warped_alpha, img_cust, hair_conf_c, face_conf_c, color_hex, balance_lighting=True, finish='matte'):
    """
    HÀI HÒA ÁNH SÁNG ĐA TẦN & NHUỘM MÀU SALON CHÂN THỰC:
    1. Tách dải sáng khối (Low-pass Form) & chi tiết từng sợi tóc (High-pass Strand Texture).
    2. Cân bằng quang thông và hướng đèn trái/phải theo khuôn mặt thật của khách hàng.
    3. Tái phân bổ kênh L + A + B chuẩn màu nhuộm Salon (giữ chân tóc sâu cho màu sáng/bạch kim/khói).
    4. Tạo độ bóng Pomade (Specularity) hoặc độ lì Tự nhiên (Matte Clay).
    """
    lab_cust = cv2.cvtColor(img_cust, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab_style = cv2.cvtColor(warped_style, cv2.COLOR_BGR2LAB).astype(np.float32)

    h_c, w_c = warped_alpha.shape[:2]
    mask_s_bool = warped_alpha > 0.28
    skin_bool = face_conf_c > 0.40
    if np.sum(skin_bool) < 200:
        skin_bool = (face_conf_c > 0.25) | (hair_conf_c > 0.30)

    L_src = lab_style[:, :, 0]
    # Normalized convolution inside hair mask so outside black canvas (L=0) never creates a bright perimeter halo
    hair_support = (warped_alpha > 0.18).astype(np.float32)
    b_l_num = cv2.GaussianBlur(L_src * hair_support, (13, 13), 0)
    b_l_den = np.maximum(cv2.GaussianBlur(hair_support, (13, 13), 0), 1e-4)
    L_smooth = np.where(hair_support > 0.5, b_l_num / b_l_den, L_src)
    interior_detail_gate = np.clip((warped_alpha - 0.38) / 0.40, 0.0, 1.0)
    L_detail = (L_src - L_smooth) * interior_detail_gate

    hair_mean_l = float(np.mean(L_src[mask_s_bool])) if np.sum(mask_s_bool) > 100 else 58.0
    hair_std_l = float(np.std(L_src[mask_s_bool])) + 1e-5 if np.sum(mask_s_bool) > 100 else 24.0
    hair_mean_a = float(np.mean(lab_style[:, :, 1][mask_s_bool])) if np.sum(mask_s_bool) > 100 else 128.0
    hair_mean_b = float(np.mean(lab_style[:, :, 2][mask_s_bool])) if np.sum(mask_s_bool) > 100 else 128.0

    # Phân tích hướng đèn và nhiệt độ màu môi trường từ da mặt khách
    mean_face_l = float(np.mean(lab_cust[:, :, 0][skin_bool])) if np.sum(skin_bool) > 100 else 142.0
    mean_face_a = float(np.mean(lab_cust[:, :, 1][skin_bool])) if np.sum(skin_bool) > 100 else 133.0
    mean_face_b = float(np.mean(lab_cust[:, :, 2][skin_bool])) if np.sum(skin_bool) > 100 else 136.0

    lighting_shift = ((mean_face_l - 138.0) * 0.22) if balance_lighting else 0.0
    room_cast_a = float(np.clip((mean_face_a - 132.0) * 0.14, -4.0, 4.0)) if balance_lighting else 0.0
    room_cast_b = float(np.clip((mean_face_b - 135.0) * 0.16, -6.0, 6.0)) if balance_lighting else 0.0

    lr_grad = np.zeros((h_c, w_c), dtype=np.float32)
    if balance_lighting and np.sum(skin_bool) > 200:
        ys, xs = np.where(skin_bool)
        mid_x = int(np.mean(xs))
        left_px = lab_cust[:, :, 0][ys[xs < mid_x], xs[xs < mid_x]]
        right_px = lab_cust[:, :, 0][ys[xs >= mid_x], xs[xs >= mid_x]]
        if left_px.size > 40 and right_px.size > 40:
            lr_diff = float(np.clip((float(np.mean(left_px)) - float(np.mean(right_px))) * 0.45, -14.0, 14.0))
            x_norm = np.linspace(0.5, -0.5, w_c, dtype=np.float32)[None, :]
            lr_grad = x_norm * lr_diff

    detail_gain = 1.08 if finish == 'gloss' else 0.94
    is_custom_dye = bool(color_hex and color_hex.startswith('#') and len(color_hex) == 7 and color_hex.lower() not in ['#141413', '#000000', '#1a1a1a'])

    if is_custom_dye:
        tr, tg, tb = int(color_hex[1:3], 16), int(color_hex[3:5], 16), int(color_hex[5:7], 16)
        tgt_bgr = np.uint8([[[tb, tg, tr]]])
        tgt_lab = cv2.cvtColor(tgt_bgr, cv2.COLOR_BGR2LAB)[0, 0].astype(np.float32)
        tgt_l, tgt_a, tgt_b = float(tgt_lab[0]), float(tgt_lab[1]), float(tgt_lab[2])

        # Điều chỉnh độ sáng (Lightness) cho màu nhuộm sáng / tẩy bạch kim / xám khói / caramel
        # Luôn giữ chiều sâu hốc tối giữa các lọn tóc và chân tóc tự nhiên (Shadow Root Depth)
        if tgt_l >= 165.0:
            target_mid_l = 122.0 + (tgt_l - 165.0) * 0.58
            target_span = 68.0
            root_floor = 46.0
            chroma_keep = 0.24
        elif tgt_l >= 95.0:
            target_mid_l = tgt_l * 0.84 + 10.0
            target_span = 58.0
            root_floor = 32.0
            chroma_keep = 0.28
        else:
            target_mid_l = max(tgt_l * 0.82 + 12.0, 42.0)
            target_span = 48.0
            root_floor = 22.0
            chroma_keep = 0.30

        l_scale = np.clip(target_span / max(hair_std_l * 2.2, 24.0), 0.78, 1.48)
        L_base_new = (L_smooth - hair_mean_l) * l_scale + target_mid_l + lighting_shift * 0.55 + lr_grad
        shadow_weight = np.clip((hair_mean_l - L_smooth) / 24.0, 0.0, 0.72)
        L_base_new = L_base_new * (1.0 - shadow_weight * 0.58) + np.maximum(L_base_new, root_floor) * (shadow_weight * 0.58)
        L_base_new = np.where(L_base_new > 202.0, 202.0 + (L_base_new - 202.0) * 0.35, L_base_new)
        L_out = L_base_new + L_detail * detail_gain

        dye_blend = np.clip((warped_alpha - 0.15) / 0.45, 0.0, 1.0) * 0.84 * (1.0 - shadow_weight * 0.22)
        lab_style[:, :, 1] = (lab_style[:, :, 1] - hair_mean_a) * chroma_keep + 128.0 * (1.0 - dye_blend) + (tgt_a + room_cast_a * 0.5) * dye_blend
        lab_style[:, :, 2] = (lab_style[:, :, 2] - hair_mean_b) * chroma_keep + 128.0 * (1.0 - dye_blend) + (tgt_b + room_cast_b * 0.5) * dye_blend
    else:
        # Đen tự nhiên chuẩn Salon Á Đông: giàu chiều sâu đen trầm, kìm highlight gắt để không bị vệt ánh kim/bạc
        target_mid_l = np.clip(32.0 + lighting_shift * 0.30, 24.0, 44.0)
        l_scale = np.clip(32.0 / max(hair_std_l * 2.2, 24.0), 0.65, 0.92)
        L_base_blk = (L_smooth - hair_mean_l) * l_scale + target_mid_l + lr_grad * 0.70
        L_base_blk = np.where(L_base_blk > 60.0, 60.0 + (L_base_blk - 60.0) * 0.30, L_base_blk)
        L_detail_blk = np.where(L_detail > 0.0, L_detail * 0.42, L_detail * 0.85)
        L_out = L_base_blk + L_detail_blk * detail_gain
        lab_style[:, :, 1] = 128.0 + (lab_style[:, :, 1] - hair_mean_a) * 0.18 + room_cast_a * 0.5
        lab_style[:, :, 2] = 128.0 + (lab_style[:, :, 2] - hair_mean_b) * 0.18 + room_cast_b * 0.5

    # Hiệu ứng sáp bóng Pomade (Specular Highlight Band) tự nhiên trên dải lọn tóc bắt sáng
    if finish == 'gloss' and np.sum(mask_s_bool) > 100:
        p65 = float(np.percentile(L_smooth[mask_s_bool], 68))
        spec_band = np.clip((L_smooth - p65) / 38.0, 0.0, 1.0)
        strand_peak = np.clip(L_detail / 20.0, 0.0, 1.0)
        L_out = L_out + spec_band * 11.0 + spec_band * strand_peak * 7.0

    lab_style[:, :, 0] = np.clip(L_out, 0.0, 255.0)
    lab_style[:, :, 1] = np.clip(lab_style[:, :, 1], 0.0, 255.0)
    lab_style[:, :, 2] = np.clip(lab_style[:, :, 2], 0.0, 255.0)

    bgr_recolored = cv2.cvtColor(lab_style.astype(np.uint8), cv2.COLOR_LAB2BGR)
    # Tăng độ sắc nét sợi tóc bên trong (không sharpen vùng rìa để triệt tiêu hoàn toàn viền sáng halo)
    blurred_hp = cv2.GaussianBlur(bgr_recolored.astype(np.float32), (0, 0), 1.0)
    sharp_w = (interior_detail_gate * 0.10)[:, :, None]
    sharp = np.clip(bgr_recolored.astype(np.float32) + sharp_w * (bgr_recolored.astype(np.float32) - blurred_hp), 0, 255).astype(np.uint8)
    return sharp

def apply_gentle_skin_polish(img_cust, face_conf_c, lm_c, w_c, h_c):
    """
    Làm mịn da nhẹ tự nhiên (Frequency-aware Bilateral) mà giữ nguyên độ sắc nét của mắt, lông mày, môi và râu.
    """
    smooth_bgr = cv2.bilateralFilter(img_cust, d=5, sigmaColor=22, sigmaSpace=22)
    skin_zone = np.clip((face_conf_c - 0.42) / 0.35, 0.0, 1.0)

    # Bảo vệ vùng mắt, chân mày, môi và sống mũi không bị bệt
    detail_protect = np.zeros((h_c, w_c), dtype=np.uint8)
    l_eye = np.array([[lm_c[i].x * w_c, lm_c[i].y * h_c] for i in [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]], dtype=np.int32)
    r_eye = np.array([[lm_c[i].x * w_c, lm_c[i].y * h_c] for i in [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]], dtype=np.int32)
    lips = np.array([[lm_c[i].x * w_c, lm_c[i].y * h_c] for i in [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]], dtype=np.int32)
    cv2.fillPoly(detail_protect, [l_eye, r_eye, lips], 255)
    detail_protect = cv2.dilate(detail_protect, np.ones((9, 9), np.uint8), iterations=1)
    detail_soft = cv2.GaussianBlur(detail_protect, (11, 11), 0).astype(np.float32) / 255.0

    blend_w = (skin_zone * (1.0 - detail_soft) * 0.34)[:, :, None]
    out = img_cust.astype(np.float32) * (1.0 - blend_w) + smooth_bgr.astype(np.float32) * blend_w
    return np.clip(out, 0, 255).astype(np.uint8)

def harmonize_camera_optics(matched_style, warped_alpha, img_cust, face_conf_c, hair_conf_c):
    """
    Đồng bộ quang học theo ống kính thực tế của người dùng (Camera Optical Harmonizer):
    1. Cân bằng sàn tối (Black Floor) theo điều kiện ánh sáng phòng thực tế trong ảnh gốc.
    2. Đồng bộ độ sắc nét / độ mềm quang học giữa khuôn mặt và mái tóc ghép.
    3. Phủ nhiễu hạt cảm biến camera (ISO Grain) trùng khớp với vùng da thật.
    """
    h_c, w_c = warped_alpha.shape[:2]
    amb_cust = (face_conf_c > 0.35) | (hair_conf_c > 0.25)
    hair_mask = warped_alpha > 0.35

    lab_hair = cv2.cvtColor(matched_style, cv2.COLOR_BGR2LAB).astype(np.float32)
    lab_cust = cv2.cvtColor(img_cust, cv2.COLOR_BGR2LAB).astype(np.float32)

    if np.sum(amb_cust) > 150 and np.sum(hair_mask) > 150:
        p02_cust = float(np.clip(np.percentile(lab_cust[:, :, 0][amb_cust], 2), 4.0, 42.0))
        p05_hair = float(np.percentile(lab_hair[:, :, 0][hair_mask], 5))
        if p05_hair < p02_cust:
            shadow_lift = (p02_cust - p05_hair) * 0.72
            shadow_band = np.clip((75.0 - lab_hair[:, :, 0]) / 55.0, 0.0, 1.0)
            lab_hair[:, :, 0] = np.clip(lab_hair[:, :, 0] + shadow_lift * shadow_band, 0.0, 255.0)

    matched_bgr = cv2.cvtColor(np.clip(lab_hair, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR).astype(np.float32)
    gray_c = cv2.cvtColor(img_cust, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gray_h = cv2.cvtColor(matched_style, cv2.COLOR_BGR2GRAY).astype(np.float32)

    if np.sum(amb_cust) > 150 and np.sum(hair_mask) > 150:
        lap_c = float(np.std(cv2.Laplacian(gray_c, cv2.CV_32F)[amb_cust]))
        lap_h = float(np.std(cv2.Laplacian(gray_h, cv2.CV_32F)[hair_mask]))
        if lap_h > 4.0 and lap_c < lap_h * 0.72:
            blur_w = float(np.clip(1.0 - lap_c / max(lap_h * 0.72, 1.0), 0.0, 0.42))
            soft_hair = cv2.GaussianBlur(matched_bgr, (3, 3), 0.75)
            matched_bgr = matched_bgr * (1.0 - blur_w) + soft_hair * blur_w

    pure_skin = (face_conf_c > 0.60) & (hair_conf_c < 0.06)
    if np.sum(pure_skin) > 120:
        skin_hp = gray_c - cv2.GaussianBlur(gray_c, (5, 5), 0)
        grain_std = float(np.clip(np.std(skin_hp[pure_skin]) * 0.52, 0.0, 2.4))
        if grain_std > 0.25:
            grain = np.random.default_rng(17).normal(0.0, grain_std, size=(h_c, w_c, 1)).astype(np.float32)
            matched_bgr = np.clip(matched_bgr + grain, 0.0, 255.0)

    return np.clip(matched_bgr, 0, 255).astype(np.uint8)

def integrate_fade_scalp(matched_style, base_canvas, refined_alpha, face_conf_c, color_hex):
    """
    Hòa tan chân tóc cạo fade sát da đầu thật (Scalp-Through Fade Shading):
    Tại vùng tóc mỏng/cạo sát 2 bên mai (0.03 < alpha < 0.78), giữ nguyên sắc tố da thật của khách
    làm nền dưới và chỉ phủ độ tối + kết cấu sợi chân tóc ngắn lên da thật để tránh lệch màu da.
    """
    is_light_bleached = False
    if color_hex and color_hex.startswith('#') and len(color_hex) == 7:
        tr, tg, tb = int(color_hex[1:3], 16), int(color_hex[3:5], 16), int(color_hex[5:7], 16)
        tgt_l = float(cv2.cvtColor(np.uint8([[[tb, tg, tr]]]), cv2.COLOR_BGR2LAB)[0, 0, 0])
        is_light_bleached = tgt_l >= 145.0

    if is_light_bleached:
        return matched_style

    matched_f = matched_style.astype(np.float32)
    base_f = base_canvas.astype(np.float32)
    lab_style_l = cv2.cvtColor(matched_style, cv2.COLOR_BGR2LAB)[:, :, 0].astype(np.float32)
    strand_hp = np.clip(lab_style_l - cv2.GaussianBlur(lab_style_l, (13, 13), 0), -14.0, 2.5)

    fade_ref_px = refined_alpha > 0.08
    style_ref_l = max(float(np.percentile(lab_style_l[fade_ref_px], 78)), 135.0) if np.sum(fade_ref_px) > 100 else 150.0
    darken_ratio = np.clip((lab_style_l - 4.0) / max(style_ref_l, 125.0), 0.30, 0.96)[:, :, None]
    scalp_fade_rgb = np.clip(base_f * darken_ratio + strand_hp[:, :, None] * 0.65, 0.0, 255.0)
    scalp_fade_rgb = np.minimum(scalp_fade_rgb, base_f * 0.98 + 2.0)

    fade_w = np.clip((0.78 - refined_alpha) / 0.33, 0.0, 0.96) * np.clip((refined_alpha - 0.03) / 0.10, 0.0, 1.0)
    matched_fade_guarded = np.minimum(matched_f, base_f * 1.04 + 6.0)
    matched_mix = matched_f * np.clip((refined_alpha - 0.65) / 0.15, 0.0, 1.0)[:, :, None] + matched_fade_guarded * (1.0 - np.clip((refined_alpha - 0.65) / 0.15, 0.0, 1.0)[:, :, None])
    out = matched_mix * (1.0 - fade_w[:, :, None]) + scalp_fade_rgb * fade_w[:, :, None]
    return np.clip(out, 0, 255).astype(np.uint8)

def restyle_portrait(image_source, hairstyle_id='layer-korean', color_hex='#141413', balance_lighting=True, smooth_skin=True, auto_preprocess=True, volume='standard', finish='matte', preserve_background=True):
    """
    Thực hiện ghép kiểu tóc mới chân thực vào ảnh chân dung gốc, bảo toàn ngũ quan, đôi tai và hậu cảnh thật.
    """
    img_cust = decode_image(image_source)
    if img_cust is None:
        return {"success": False, "error": "Không thể giải mã dữ liệu ảnh chân dung của khách hàng."}

    try:
        detector = get_detector()
        segmenter = get_segmenter()
    except Exception as e:
        return {"success": False, "error": f"Lỗi khởi tạo mô hình AI: {str(e)}"}

    # 0. Tự động căn khung chân dung 3:4 (Auto-Crop) nhưng GIỮ NGUYÊN hậu cảnh thật của khách
    cropped_img = img_cust
    bg_removed = False
    if auto_preprocess:
        try:
            cropped_img = auto_crop_portrait(img_cust, detector=detector, target_w=600, target_h=800)
            if cropped_img is not None:
                if not preserve_background:
                    clean_bald_base, _, _ = remove_background_and_old_hair(cropped_img, detector=detector, segmenter=segmenter, background_mode='studio')
                    if clean_bald_base is not None:
                        img_cust = clean_bald_base
                        bg_removed = True
                    else:
                        img_cust = cropped_img
                else:
                    img_cust = cropped_img
        except Exception:
            pass

    h_c, w_c = img_cust.shape[:2]

    # Phân tích nhân trắc học ngũ quan trên ảnh chân dung thật (không xuất ảnh phụ thừa để tăng tốc)
    analysis = analyze_portrait(img_cust, include_assets=False)
    if not analysis.get('success', False):
        return analysis

    mp_cust = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(img_cust, cv2.COLOR_BGR2RGB))
    det_c = detector.detect(mp_cust)
    if not det_c.face_landmarks:
        return {"success": False, "error": "Không tìm thấy khuôn mặt rõ nét trong ảnh."}
    lm_c = det_c.face_landmarks[0]

    seg_cust = segmenter.segment(mp_cust)
    bg_conf_c = seg_cust.confidence_masks[0].numpy_view().reshape((h_c, w_c))
    hair_conf_c = seg_cust.confidence_masks[1].numpy_view().reshape((h_c, w_c))
    body_conf_c = seg_cust.confidence_masks[2].numpy_view().reshape((h_c, w_c))
    face_conf_c = seg_cust.confidence_masks[3].numpy_view().reshape((h_c, w_c))
    clothes_conf_c = seg_cust.confidence_masks[4].numpy_view().reshape((h_c, w_c))

    if smooth_skin:
        img_cust = apply_gentle_skin_polish(img_cust, face_conf_c, lm_c, w_c, h_c)

    style_data = get_style_data(hairstyle_id, segmenter, detector)
    if style_data is None:
        return {"success": False, "error": f"Không tìm thấy mẫu tóc {hairstyle_id}"}

    style_img = style_data['img']
    style_hair_alpha = style_data['hair_alpha']
    lm_s = style_data['lm']
    h_s, w_s = style_data['shape']

    # 1. Biến dạng sọ đầu đa điểm Delaunay Piecewise theo góc xoay đầu 3D & độ phồng (volume)
    pts_s = get_skull_anchors(lm_s, w_s, h_s, volume='standard')
    pts_c = get_skull_anchors(lm_c, w_c, h_c, volume=volume)
    warped_style, warped_alpha = piecewise_delaunay_warp(style_img, style_hair_alpha, pts_s, pts_c, w_c, h_c)

    # 2. Giữ nguyên vùng chân mày và mắt của khách hàng
    eyebrow_pts_l = np.array([[lm_c[idx].x * w_c, lm_c[idx].y * h_c] for idx in [70, 63, 105, 66, 107, 55, 65, 52, 53, 46, 124, 35, 111, 117]], dtype=np.int32)
    eyebrow_pts_r = np.array([[lm_c[idx].x * w_c, lm_c[idx].y * h_c] for idx in [300, 293, 334, 296, 336, 285, 295, 282, 283, 276, 353, 265, 340, 346]], dtype=np.int32)
    eyes_raw = np.zeros((h_c, w_c), dtype=np.uint8)
    cv2.fillPoly(eyes_raw, [eyebrow_pts_l, eyebrow_pts_r], 255)
    eyes_mask = cv2.dilate(eyes_raw, np.ones((7, 7), np.uint8), iterations=1)
    eyes_protect = cv2.GaussianBlur(eyes_mask, (11, 11), 0).astype(np.float32) / 255.0
    warped_alpha = warped_alpha * (1.0 - eyes_protect)

    # 3. Giữ nguyên vùng da mặt & mở mái tự nhiên cho các kiểu tóc có phần mái rủ
    eyebrow_min_y = max(2, int(min(lm_c[70].y, lm_c[300].y) * h_c))
    upper_eyelid_y = max(eyebrow_min_y + 2, int(min(lm_c[159].y, lm_c[386].y) * h_c))
    lower_face_protect = ((face_conf_c > 0.34) & (hair_conf_c < 0.20)).astype(np.float32)
    fringe_styles = ['french-crop', 'layer-korean', 'two-block', 'mullet-modern', 'ripple-perm', 'sidepart-gentleman']
    fringe_cutoff = min(h_c - 1, eyebrow_min_y + 12) if hairstyle_id in fringe_styles else max(1, eyebrow_min_y - 6)
    lower_face_protect[:fringe_cutoff, :] = 0.0
    lower_face_protect = cv2.GaussianBlur(lower_face_protect, (15, 15), 0)

    ear_protect = build_ear_protect_mask(lm_c, face_conf_c, body_conf_c, hair_conf_c, w_c, h_c, hairstyle_id)
    warped_alpha = warped_alpha * (1.0 - lower_face_protect) * (1.0 - ear_protect * 0.75)

    # 4. Tái tạo sạch vùng tóc cũ thừa trên nền thật & da trán khách hàng
    inpainted_canvas = inpaint_old_hair_natural(img_cust, hair_conf_c, face_conf_c, bg_conf_c, body_conf_c, clothes_conf_c, warped_alpha, lm_c, w_c, h_c)
    base_canvas = clean_old_hair_background(inpainted_canvas, bg_conf_c, hair_conf_c, face_conf_c, warped_alpha, lm_c, w_c, h_c)

    # 5. Sinh bóng đổ chân tóc tiếp xúc (Contact Shadow)
    shadow_map = synthesize_forehead_shadow(warped_alpha, face_conf_c, lm_c, w_c, h_c)
    shadow_3ch = shadow_map[:, :, np.newaxis]
    base_canvas = np.clip(base_canvas.astype(np.float32) * (1.0 - shadow_3ch), 0, 255).astype(np.uint8)

    # 6. Hiệu chỉnh ánh sáng đa tần, Nhuộm màu Salon & Đồng bộ quang học camera thật
    matched_style = reinhard_color_adaptation(warped_style, warped_alpha, img_cust, hair_conf_c, face_conf_c, color_hex, balance_lighting=balance_lighting, finish=finish)
    matched_style = harmonize_camera_optics(matched_style, warped_alpha, img_cust, face_conf_c, hair_conf_c)

    # 7. Guided Filter Hair Matting + Tách sợi chân tóc tơ vi mô & chuyển sắc mềm dọc đường chân tóc
    warped_alpha_u8 = np.clip(warped_alpha * 255, 0, 255).astype(np.uint8)
    try:
        gf_alpha = cv2.ximgproc.guidedFilter(warped_style, warped_alpha_u8, radius=2, eps=0.025).astype(np.float32) / 255.0
        refined_alpha = cv2.GaussianBlur(0.35 * gf_alpha + 0.65 * warped_alpha, (5, 5), 0)
    except Exception:
        refined_alpha = cv2.GaussianBlur(warped_alpha, (5, 5), 0)

    # Tạo độ chuyển sợi tơ siêu nhỏ dọc đường chân tóc trên trán (tránh mép cắt cứng như mũ dán)
    gray_h_edge = cv2.cvtColor(matched_style, cv2.COLOR_BGR2GRAY).astype(np.float32)
    strand_hp_a = gray_h_edge - cv2.GaussianBlur(gray_h_edge, (7, 7), 0)
    hairline_band = ((refined_alpha > 0.10) & (refined_alpha < 0.86)).astype(np.float32)
    refined_alpha = refined_alpha + np.clip(strand_hp_a / 44.0, -0.12, 0.12) * hairline_band
    # Làm dịu chuyển tiếp chân tóc tiếp xúc vùng da trán và viền rìa ngoài để tóc mọc tự nhiên, không bị viền gắt
    forehead_transition = cv2.GaussianBlur(((face_conf_c > 0.22) & (refined_alpha > 0.05) & (refined_alpha < 0.72)).astype(np.float32), (9, 9), 0)
    outer_rim_feather = cv2.GaussianBlur(((refined_alpha > 0.04) & (refined_alpha < 0.55) & (face_conf_c < 0.22)).astype(np.float32), (7, 7), 0)
    refined_alpha = refined_alpha * (1.0 - forehead_transition * 0.24) * (1.0 - outer_rim_feather * 0.18)
    refined_alpha = np.clip(refined_alpha, 0.0, 1.0) * (1.0 - eyes_protect) * (1.0 - lower_face_protect * 0.88) * (1.0 - ear_protect * 0.75)

    # Hòa tan vùng fade 2 bên thái dương vào chính sắc tố da thật của khách
    matched_style = integrate_fade_scalp(matched_style, base_canvas, refined_alpha, face_conf_c, color_hex)
    refined_alpha_3ch = refined_alpha[:, :, np.newaxis]

    # 8. Bảo toàn 100% ngũ quan thật từ ảnh chân dung gốc (dùng lõi mắt & chân mày khít, không kéo lại tóc mái cũ)
    eyes_core = (eyes_raw.astype(np.float32) / 255.0) * (hair_conf_c < 0.28).astype(np.float32)
    face_identity_mask = ((face_conf_c > 0.42) & (hair_conf_c < 0.14)).astype(np.float32)
    face_identity_mask[:upper_eyelid_y, :] = 0.0
    face_identity_mask = np.maximum(face_identity_mask, np.maximum(eyes_core * 0.90, ear_protect * 0.80))
    face_identity_mask = cv2.GaussianBlur(face_identity_mask, (9, 9), 0)[:, :, None]

    blended_composite = (matched_style.astype(np.float32) * refined_alpha_3ch + base_canvas.astype(np.float32) * (1.0 - refined_alpha_3ch))
    final_composite = blended_composite * (1.0 - face_identity_mask) + img_cust.astype(np.float32) * face_identity_mask
    final_composite = np.clip(final_composite, 0, 255).astype(np.uint8)

    _, buf = cv2.imencode('.jpg', final_composite, [cv2.IMWRITE_JPEG_QUALITY, 95])
    result_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"

    return {
        "success": True,
        "resultImageUrl": result_b64,
        "faceAnalysis": analysis,
        "hairstyleId": hairstyle_id,
        "colorHex": color_hex,
        "volume": volume,
        "finish": finish,
        "isFacePreserved": True,
        "autoCropApplied": bool(auto_preprocess),
        "backgroundRemoved": bg_removed,
        "backgroundPreserved": bool(preserve_background),
        "oldHairRemoved": True,
        "provider": "Omni Vision 3D Hair Engine (3D Yaw Fit + Scalp-Through Fade + Optical Match)"
    }

if __name__ == '__main__':
    mode = 'analyze'
    args = sys.argv[1:]
    if len(args) > 0 and args[0] in ['analyze', 'restyle']:
        mode = args[0]
        args = args[1:]

    input_data = ''
    if len(args) > 0 and os.path.exists(args[0]):
        input_data = args[0]
    else:
        input_data = sys.stdin.read().strip()

    if mode == 'restyle':
        style_id = 'layer-korean'
        col_hex = '#141413'
        smooth = True
        balance = True
        volume_val = 'standard'
        finish_val = 'matte'
        preserve_bg = True

        if input_data.startswith('{') and input_data.endswith('}'):
            try:
                j = json.loads(input_data)
                img_src = j.get('image') or j.get('imageBase64') or j.get('originalImageBase64') or ''
                style_id = j.get('hairstyleId') or j.get('hairstyleName') or 'layer-korean'
                col_hex = j.get('colorHex') or j.get('hairColorHex') or '#141413'
                smooth = j.get('smoothSkin', True)
                balance = j.get('balanceLighting', True)
                volume_val = j.get('volume') or 'standard'
                finish_val = j.get('finish') or 'matte'
                preserve_bg = j.get('preserveBackground', True)
                input_data = img_src
            except Exception:
                pass

        out = restyle_portrait(
            input_data,
            hairstyle_id=style_id,
            color_hex=col_hex,
            balance_lighting=balance,
            smooth_skin=smooth,
            volume=volume_val,
            finish=finish_val,
            preserve_background=preserve_bg
        )
    else:
        inc_assets = True
        if input_data.startswith('{') and input_data.endswith('}'):
            try:
                j = json.loads(input_data)
                inc_assets = bool(j.get('includeAssets', True))
                input_data = j.get('image') or j.get('imageBase64') or input_data
            except Exception:
                pass
        out = analyze_portrait(input_data, include_assets=inc_assets)

    print(json.dumps(out, ensure_ascii=False))

