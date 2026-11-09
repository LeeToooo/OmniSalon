// ============================================================================
// OmniSalon & Omni Salon Enterprise Suite
// PHÂN HỆ KHÁCH HÀNG - MODULE MEGA MENU CỬA HÀNG & CHI NHÁNH (CUSTOMER MEGA MENU)
// File: web/frontend/js/modules/customer/customer-mega-menu.js
// ============================================================================

(function (window) {
  'use strict';

  const CustomerMegaMenu = {
    _megaTimers: {},

    /**
     * Xử lý rê chuột vào Mega Menu
     * @param {'shop'|'branches'} type 
     */
    handleMegaEnter(type) {
      const timers = this._megaTimers || (window.CustomerWeb && window.CustomerWeb._megaTimers) || {};
      if (timers[type]) {
        clearTimeout(timers[type]);
        delete timers[type];
      }
      ['shop', 'branches'].forEach(t => {
        if (t !== type) {
          if (typeof this.closeMegaMenu === 'function') {
            this.closeMegaMenu(t);
          } else if (window.CustomerWeb && typeof window.CustomerWeb.closeMegaMenu === 'function') {
            window.CustomerWeb.closeMegaMenu(t);
          }
        }
      });
      const el = document.getElementById(type === 'shop' ? 'headerShopMegaDropdown' : 'headerBranchesMegaDropdown');
      const wrap = document.getElementById(type === 'shop' ? 'navShopMegaWrap' : 'navBranchesMegaWrap');
      if (el) {
        el.classList.add('open', 'is-open', 'show', 'active');
      }
      if (wrap) {
        wrap.classList.add('active', 'is-open');
      }
    },

    /**
     * Xử lý rê chuột ra khỏi Mega Menu (có độ trễ để tránh tắt đột ngột)
     * @param {'shop'|'branches'} type 
     */
    handleMegaLeave(type) {
      if (!this._megaTimers) this._megaTimers = {};
      this._megaTimers[type] = setTimeout(() => {
        if (typeof this.closeMegaMenu === 'function') {
          this.closeMegaMenu(type);
        } else if (window.CustomerWeb && typeof window.CustomerWeb.closeMegaMenu === 'function') {
          window.CustomerWeb.closeMegaMenu(type);
        }
      }, 160);
      if (window.CustomerWeb) {
        if (!window.CustomerWeb._megaTimers) window.CustomerWeb._megaTimers = {};
        window.CustomerWeb._megaTimers[type] = this._megaTimers[type];
      }
    },

    /**
     * Đóng một Mega Menu cụ thể
     * @param {'shop'|'branches'} type 
     */
    closeMegaMenu(type) {
      const el = document.getElementById(type === 'shop' ? 'headerShopMegaDropdown' : 'headerBranchesMegaDropdown');
      const wrap = document.getElementById(type === 'shop' ? 'navShopMegaWrap' : 'navBranchesMegaWrap');
      if (el) {
        el.classList.remove('open', 'is-open', 'show', 'active');
      }
      if (wrap) {
        wrap.classList.remove('active', 'is-open');
      }
    },

    /**
     * Đóng tất cả các Mega Menu
     */
    closeAllMegaMenus() {
      ['shop', 'branches'].forEach(t => {
        if (typeof this.closeMegaMenu === 'function') {
          this.closeMegaMenu(t);
        } else if (window.CustomerWeb && typeof window.CustomerWeb.closeMegaMenu === 'function') {
          window.CustomerWeb.closeMegaMenu(t);
        }
      });
    },

    /**
     * Xử lý click trên thanh điều hướng (hỗ trợ responsive mobile drawer / desktop switchTab)
     * @param {'shop'|'branches'} type 
     * @param {Event} event 
     */
    handleNavMegaClick(type, event) {
      if (event) event.preventDefault();
      const dropdown = document.getElementById(type === 'shop' ? 'headerShopMegaDropdown' : 'headerBranchesMegaDropdown');
      const isOpen = dropdown && (dropdown.classList.contains('open') || dropdown.classList.contains('is-open') || dropdown.classList.contains('show'));

      if (isOpen) {
        if (typeof this.closeMegaMenu === 'function') {
          this.closeMegaMenu(type);
        } else if (window.CustomerWeb && typeof window.CustomerWeb.closeMegaMenu === 'function') {
          window.CustomerWeb.closeMegaMenu(type);
        }
      } else {
        if (typeof this.handleMegaEnter === 'function') {
          this.handleMegaEnter(type);
        } else if (window.CustomerWeb && typeof window.CustomerWeb.handleMegaEnter === 'function') {
          window.CustomerWeb.handleMegaEnter(type);
        }
      }
    },

    /**
     * Chọn danh mục sản phẩm từ Mega Menu
     * @param {string} catId 
     * @param {Event} event 
     */
    selectShopCategory(catId, event) {
      if (event) event.preventDefault();
      if (typeof this.closeAllMegaMenus === 'function') {
        this.closeAllMegaMenus();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeAllMegaMenus === 'function') {
        window.CustomerWeb.closeAllMegaMenus();
      }

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate('/shop?category=' + encodeURIComponent(catId));
      } else {
        if (typeof this.switchTab === 'function') {
          this.switchTab('shop');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
          window.CustomerWeb.switchTab('shop');
        }
      }
      if (window.ShopPage && typeof window.ShopPage.setCategory === 'function') {
        window.ShopPage.setCategory(catId);
      }
    },

    /**
     * Chọn thương hiệu sản phẩm từ Mega Menu
     * @param {string} brandId 
     * @param {Event} event 
     */
    selectShopBrand(brandId, event) {
      if (event) event.preventDefault();
      if (typeof this.closeAllMegaMenus === 'function') {
        this.closeAllMegaMenus();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeAllMegaMenus === 'function') {
        window.CustomerWeb.closeAllMegaMenus();
      }

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate('/shop?brand=' + encodeURIComponent(brandId));
      } else {
        if (typeof this.switchTab === 'function') {
          this.switchTab('shop');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
          window.CustomerWeb.switchTab('shop');
        }
        if (window.ShopPage && typeof window.ShopPage.setBrand === 'function') {
          window.ShopPage.setBrand(brandId);
        }
      }
    },

    /**
     * Chọn mục đặc biệt từ Mega Menu (bestseller, sale...)
     * @param {'bestseller'|'all'} specialType 
     * @param {Event} event 
     */
    selectShopSpecial(specialType, event) {
      if (event) event.preventDefault();
      if (typeof this.closeAllMegaMenus === 'function') {
        this.closeAllMegaMenus();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeAllMegaMenus === 'function') {
        window.CustomerWeb.closeAllMegaMenus();
      }

      if (specialType === 'bestseller') {
        if (typeof this.selectShopCategory === 'function') {
          return this.selectShopCategory('bestsellers', event);
        } else if (window.CustomerWeb && typeof window.CustomerWeb.selectShopCategory === 'function') {
          return window.CustomerWeb.selectShopCategory('bestsellers', event);
        }
      } else {
        if (typeof this.selectShopCategory === 'function') {
          return this.selectShopCategory('all', event);
        } else if (window.CustomerWeb && typeof window.CustomerWeb.selectShopCategory === 'function') {
          return window.CustomerWeb.selectShopCategory('all', event);
        }
      }
    },

    /**
     * Chọn chi nhánh theo quận huyện từ Mega Menu
     * @param {string} district 
     * @param {Event} event 
     */
    selectBranchDistrict(district, event) {
      if (event) event.preventDefault();
      if (typeof this.closeAllMegaMenus === 'function') {
        this.closeAllMegaMenus();
      } else if (window.CustomerWeb && typeof window.CustomerWeb.closeAllMegaMenus === 'function') {
        window.CustomerWeb.closeAllMegaMenus();
      }

      if (window.AppRouter && typeof window.AppRouter.navigate === 'function') {
        window.AppRouter.navigate('/branches?district=' + encodeURIComponent(district));
      } else {
        if (typeof this.switchTab === 'function') {
          this.switchTab('branches');
        } else if (window.CustomerWeb && typeof window.CustomerWeb.switchTab === 'function') {
          window.CustomerWeb.switchTab('branches');
        }
        if (window.BranchesPage && typeof window.BranchesPage.setDistrict === 'function') {
          window.BranchesPage.setDistrict(district);
        }
      }
    },

    /**
     * Render HTML nội dung Mega Menu Cửa hàng (Shop)
     */
    renderShopMegaMenuHTML() {
      return `
        <div class="mega-menu-content-grid">
          <!-- CỘT 1: GROOMING / TẠO KIỂU -->
          <div class="mega-column">
            <div class="mega-col-title">GROOMING</div>
            <ul class="mega-col-list">
              <li><a href="/shop?category=DM02" onclick="CustomerWeb.selectShopCategory('DM02', event)">Pomade gốc dầu &amp; gốc nước</a></li>
              <li><a href="/shop?category=DM01" onclick="CustomerWeb.selectShopCategory('DM01', event)">Clay, wax &amp; fiber tạo phồng</a></li>
              <li><a href="/shop?category=DM03" onclick="CustomerWeb.selectShopCategory('DM03', event)">Pre-styling &amp; xịt muối biển</a></li>
              <li><a href="/shop?category=DM05" onclick="CustomerWeb.selectShopCategory('DM05', event)">Dầu gội &amp; dưỡng tóc nam</a></li>
              <li><a href="/shop?category=DM08" onclick="CustomerWeb.selectShopCategory('DM08', event)">Chăm sóc râu &amp; shaving</a></li>
              <li class="mega-col-action"><a href="/shop" onclick="CustomerWeb.selectShopCategory('all', event)">Tất cả sáp vuốt tóc &rarr;</a></li>
            </ul>
          </div>

          <!-- CỘT 2: THỜI TRANG & DỤNG CỤ BARBER -->
          <div class="mega-column">
            <div class="mega-col-title">PHỤ KIỆN &amp; DỤNG CỤ</div>
            <ul class="mega-col-list">
              <li><a href="/shop?category=DM09" onclick="CustomerWeb.selectShopCategory('DM09', event)">Lược bán nguyệt &amp; afro</a></li>
              <li><a href="/shop?category=DM09" onclick="CustomerWeb.selectShopCategory('DM09', event)">Máy sấy tạo phồng Nanoe</a></li>
              <li><a href="/shop?category=DM04" onclick="CustomerWeb.selectShopCategory('DM04', event)">Gôm xịt khóa nếp hairspray</a></li>
              <li><a href="/shop?category=DM06" onclick="CustomerWeb.selectShopCategory('DM06', event)">Bột rắc tạo phồng volume</a></li>
              <li><a href="/shop?category=DM07" onclick="CustomerWeb.selectShopCategory('DM07', event)">Uốn lạnh down perm tại nhà</a></li>
            </ul>
          </div>

          <!-- CỘT 3: THƯƠNG HIỆU HÀNG ĐẦU -->
          <div class="mega-column">
            <div class="mega-col-title">THƯƠNG HIỆU</div>
            <ul class="mega-col-list">
              <li><a href="/shop?brand=apestomen" onclick="CustomerWeb.selectShopBrand('apestomen', event)">Apestomen (Singapore)</a></li>
              <li><a href="/shop?brand=hanz%20de%20fuko" onclick="CustomerWeb.selectShopBrand('hanz de fuko', event)">Hanz de Fuko (California)</a></li>
              <li><a href="/shop?brand=blumaan" onclick="CustomerWeb.selectShopBrand('blumaan', event)">Blumaan (USA)</a></li>
              <li><a href="/shop?brand=reuzel" onclick="CustomerWeb.selectShopBrand('reuzel', event)">Reuzel Pomade (Rotterdam)</a></li>
              <li><a href="/shop?brand=kevin-uppercut" onclick="CustomerWeb.selectShopBrand('kevin-uppercut', event)">Kevin Murphy &amp; Uppercut</a></li>
              <li><a href="/shop?brand=davines" onclick="CustomerWeb.selectShopBrand('davines', event)">Davines (Italy)</a></li>
              <li class="mega-col-action"><a href="/shop" onclick="CustomerWeb.selectShopCategory('all', event)">Xem tất cả thương hiệu &rarr;</a></li>
            </ul>
          </div>

          <!-- CỘT 4: DANH MỤC KHÁC -->
          <div class="mega-column">
            <div class="mega-col-title">DANH MỤC KHÁC</div>
            <ul class="mega-col-list">
              <li><a href="/shop" onclick="CustomerWeb.selectShopSpecial('bestseller', event)">Sản phẩm bán chạy</a></li>
              <li>
                <a href="/shop?category=fefo_expiry" onclick="CustomerWeb.selectShopCategory('fefo_expiry', event)" style="font-weight: 700; color: #DC2626;">
                  END OF SEASON SALE <span class="mega-badge-sale">SALE</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      `;
    },

    /**
     * Render HTML nội dung Mega Menu Chi nhánh (Branches)
     */
    renderBranchesMegaMenuHTML() {
      return `
        <div class="mega-menu-content-grid">
          <!-- CỘT 1: TRUNG TÂM TP.HCM -->
          <div class="mega-column">
            <div class="mega-col-title">TRUNG TÂM TP.HCM</div>
            <ul class="mega-col-list">
              <li><a href="/branches?district=Qu%E1%BA%ADn%201" onclick="CustomerWeb.selectBranchDistrict('Quận 1', event)">Quận 1 - Bến Thành (Flagship)</a></li>
              <li><a href="/branches?district=Qu%E1%BA%ADn%203" onclick="CustomerWeb.selectBranchDistrict('Quận 3', event)">Quận 3 - Nam Kỳ Khởi Nghĩa</a></li>
              <li><a href="/branches?district=Qu%E1%BA%ADn%205" onclick="CustomerWeb.selectBranchDistrict('Quận 5', event)">Quận 5 - Trần Hưng Đạo</a></li>
              <li><a href="/branches?district=Qu%E1%BA%ADn%2010" onclick="CustomerWeb.selectBranchDistrict('Quận 10', event)">Quận 10 - 3 Tháng 2</a></li>
              <li class="mega-col-action"><a href="/branches" onclick="CustomerWeb.selectBranchDistrict('all', event)">Xem tất cả 20 chi nhánh &rarr;</a></li>
            </ul>
          </div>

          <!-- CỘT 2: KHU ĐÔNG & KHU NAM -->
          <div class="mega-column">
            <div class="mega-col-title">KHU ĐÔNG &amp; KHU NAM</div>
            <ul class="mega-col-list">
              <li><a href="/branches?district=TP.%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c" onclick="CustomerWeb.selectBranchDistrict('TP. Thủ Đức', event)">TP. Thủ Đức - Thảo Điền</a></li>
              <li><a href="/branches?district=TP.%20Th%E1%BB%A7%20%C4%90%E1%BB%A9c" onclick="CustomerWeb.selectBranchDistrict('TP. Thủ Đức', event)">TP. Thủ Đức - Võ Văn Ngân</a></li>
              <li><a href="/branches?district=Qu%E1%BA%ADn%207" onclick="CustomerWeb.selectBranchDistrict('Quận 7', event)">Quận 7 - Nguyễn Thị Thập</a></li>
              <li><a href="/branches?district=Qu%E1%BA%ADn%204" onclick="CustomerWeb.selectBranchDistrict('Quận 4', event)">Quận 4 - Hoàng Diệu</a></li>
              <li><a href="/branches?district=Qu%E1%BA%ADn%208" onclick="CustomerWeb.selectBranchDistrict('Quận 8', event)">Quận 8 - Dương Bá Trạc</a></li>
            </ul>
          </div>

          <!-- CỘT 3: KHU BẮC & KHU TÂY -->
          <div class="mega-column">
            <div class="mega-col-title">KHU BẮC &amp; KHU TÂY</div>
            <ul class="mega-col-list">
              <li><a href="/branches?district=B%C3%ACnh%20Th%E1%BA%A1nh" onclick="CustomerWeb.selectBranchDistrict('Bình Thạnh', event)">Bình Thạnh - Điện Biên Phủ</a></li>
              <li><a href="/branches?district=T%C3%A2n%20B%C3%ACnh" onclick="CustomerWeb.selectBranchDistrict('Tân Bình', event)">Tân Bình - Cộng Hòa</a></li>
              <li><a href="/branches?district=G%C3%B2%20V%E1%BA%A5p" onclick="CustomerWeb.selectBranchDistrict('Gò Vấp', event)">Gò Vấp - Quang Trung</a></li>
              <li><a href="/branches?district=Ph%C3%BA%20Nhu%E1%BA%ADn" onclick="CustomerWeb.selectBranchDistrict('Phú Nhuận', event)">Phú Nhuận - Phan Xích Long</a></li>
              <li><a href="/branches?district=T%C3%A2n%20Ph%C3%BA" onclick="CustomerWeb.selectBranchDistrict('Tân Phú', event)">Tân Phú - Lũy Bán Bích</a></li>
            </ul>
          </div>

          <!-- CỘT 4: ĐẶC QUYỀN SALON -->
          <div class="mega-column">
            <div class="mega-col-title">ĐẶC QUYỀN &amp; TIỆN ÍCH</div>
            <ul class="mega-col-list">
              <li><a href="/booking" onclick="CustomerWeb.switchTab('booking'); CustomerWeb.closeAllMegaMenus();">Đặt lịch giữ chỗ barber</a></li>
              <li><span style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.5; display: block; margin-top: 4px;">Giờ mở cửa: 08:30 - 21:30 mỗi ngày</span></li>
            </ul>
          </div>
        </div>
      `;
    }
  };

  // 1. Gán vào đối tượng toàn cục
  window.CustomerMegaMenu = CustomerMegaMenu;

  // 2. Đồng bộ ngược với CustomerWeb nếu đã được nạp
  if (typeof window.CustomerWeb !== 'undefined') {
    Object.assign(window.CustomerWeb, CustomerMegaMenu);
  }

  // 3. Tự động đóng dropdown khi click ra bên ngoài (Outside Click Listener)
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      const isInsideMega = e.target.closest('#navShopMegaWrap') ||
        e.target.closest('#navBranchesMegaWrap') ||
        e.target.closest('#headerShopMegaDropdown') ||
        e.target.closest('#headerBranchesMegaDropdown');
      if (!isInsideMega) {
        CustomerMegaMenu.closeAllMegaMenus();
      }
    });
  }

})(typeof window !== 'undefined' ? window : this);

