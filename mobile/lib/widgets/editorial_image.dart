import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class EditorialImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final double? aspectRatio;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final bool enableWarmFilter;
  final Widget? overlay;
  final IconData fallbackIcon;

  const EditorialImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.aspectRatio,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.enableWarmFilter = true,
    this.overlay,
    this.fallbackIcon = Icons.content_cut_rounded,
  });

  @override
  Widget build(BuildContext context) {
    final cleanUrl = imageUrl.trim();
    Widget imageWidget;

    if (cleanUrl.isEmpty) {
      imageWidget = _buildPlaceholder();
    } else {
      final int targetCacheWidth = (width != null && width!.isFinite && width! > 0)
          ? (width! * 2).clamp(160, 1200).toInt()
          : 800;

      imageWidget = Image.network(
        cleanUrl,
        width: width,
        height: height,
        fit: fit,
        cacheWidth: targetCacheWidth,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) {
            return enableWarmFilter ? _applyWarmToneFilter(child) : child;
          }
          return _buildLoadingState(loadingProgress);
        },
        errorBuilder: (context, error, stackTrace) {
          return _buildPlaceholder();
        },
      );
    }

    if (overlay != null) {
      imageWidget = Stack(
        fit: StackFit.passthrough,
        children: [
          imageWidget,
          Positioned.fill(child: overlay!),
        ],
      );
    }

    if (borderRadius != null) {
      imageWidget = ClipRRect(
        borderRadius: borderRadius!,
        child: imageWidget,
      );
    }

    if (aspectRatio != null) {
      imageWidget = AspectRatio(
        aspectRatio: aspectRatio!,
        child: imageWidget,
      );
    }

    return imageWidget;
  }

  // Bộ lọc màu ấm nhẹ (Warm Editorial Toning) giúp ảnh hài hòa với tông màu Kem & Vàng đồng
  Widget _applyWarmToneFilter(Widget child) {
    return ColorFiltered(
      colorFilter: const ColorFilter.mode(
        Color(0x0DC59B27), // 5% vàng đồng ấm
        BlendMode.multiply,
      ),
      child: child,
    );
  }

  Widget _buildLoadingState(ImageChunkEvent loadingProgress) {
    final expected = loadingProgress.expectedTotalBytes;
    final loaded = loadingProgress.cumulativeBytesLoaded;
    final progress = expected != null ? (loaded / expected) : null;

    return Container(
      width: width,
      height: height,
      color: AppTheme.surfaceElevated,
      child: Center(
        child: SizedBox(
          width: 20,
          height: 20,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            value: progress,
            valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accentGold),
          ),
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppTheme.surfaceElevated,
        borderRadius: borderRadius,
        border: Border.all(color: AppTheme.borderColorSubtle),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppTheme.surfaceElevated,
            AppTheme.surfaceCard,
          ],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(fallbackIcon, size: 26, color: AppTheme.accentGold.withValues(alpha: 0.7)),
            const SizedBox(height: 4),
            Text(
              'OMNI SALON',
              style: AppTheme.labelUppercase(
                fontSize: 9,
                color: AppTheme.textMuted.withValues(alpha: 0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
