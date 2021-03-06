import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { GET_ALL_PRODUCT_URL, GET_PRODUCTS_FOR_SHOP_URL, GET_PRODUCTS_URL, GET_PRODUCT_URL, PRODUCT_TYPE_JIT } from 'src/shared/constants';
import { Product } from 'src/models/product.model';
import { Router } from '@angular/router';
import { Company } from 'src/models/company.model';
import { Order } from 'src/models';


@Injectable({
  providedIn: 'root'
})
export class ProductService {



  private productListBehaviorSubject: BehaviorSubject<Product[]>;
  public productListObservable: Observable<Product[]>;

  private productBehaviorSubject: BehaviorSubject<Product>;
  public productObservable: Observable<Product>;
  url: string;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.productListBehaviorSubject = new BehaviorSubject<Product[]>(JSON.parse(localStorage.getItem('ProductsList')) || []);
    this.productBehaviorSubject = new BehaviorSubject<Product>(JSON.parse(localStorage.getItem('currentProduct')) || null);
    this.productListObservable = this.productListBehaviorSubject.asObservable();
    this.productObservable = this.productBehaviorSubject.asObservable();
    this.url = environment.API_URL;
  }

  public get currentProductValue(): Product {
    return this.productBehaviorSubject.value;
  }

  updateProductListState(grades: Product[]) {
    this.productListBehaviorSubject.next(grades);
    localStorage.setItem('ProductsList', JSON.stringify(grades));
  }
  updateProductState(product: Product) {
    this.productBehaviorSubject.next(product);
    localStorage.setItem('currentProduct', JSON.stringify(product));
  }
  add(product: Product) {
    return this.http.post<Product>(`${this.url}/api/product/add-product.php`, product);
  }
  update(product: Product) {
    return this.http.post<Product>(`${this.url}/api/product/update-product.php`, product);
  }
  updateRange(products: Product[]) {
    return this.http.post<Product[]>(`${this.url}/api/product/update-product-range.php`, products);
  }
  getProducts(companyId: string) {
    this.http.get<Product[]>(`${this.url}/${GET_PRODUCTS_URL}?CompanyId=${companyId}`).subscribe(data => {
      this.updateProductListState(data || []);
    });
  }
  getProductsSync(companyId: string) {
    return this.http.get<Product[]>(`${this.url}/${GET_PRODUCTS_URL}?CompanyId=${companyId}`);
  }

  getProductsSyncForShop(companyId: string) {
    return this.http.get<Company>(`${this.url}/${GET_PRODUCTS_FOR_SHOP_URL}?CompanyId=${companyId}`);
  }
  getAllActiveProductsSync() {
    return this.http.get<Product[]>(`${this.url}/api/product/get-all-active-products-for-shop.php`);
  }


  getProduct(ProductId: string) {
    this.http.get<Product>(`${this.url}/${GET_PRODUCT_URL}?ProductId=${ProductId}`).subscribe(data => {
      if (data) {
        this.updateProductState(data);
      }
    });
  }


  getProductSync(ProductId: string) {
    return this.http.get<Product>(`${this.url}/${GET_PRODUCT_URL}?ProductId=${ProductId}`);
  }
  getAllProductsSync() {
    return this.http.get<Product[]>(`${this.url}/${GET_ALL_PRODUCT_URL}`);
  }


  generateSlug(company: string, name: string, code: string): string {
    name = name.trim();
    let slug = name.toLocaleLowerCase().split(' ').join('-');
    slug = `${code.toLocaleLowerCase()}-${slug}`;
    slug = `${company.toLocaleLowerCase().split(' ').join('-')}-${slug}`;
    const slugArray = slug.split('');
    let newSlug = '';
    slugArray.forEach(item => {
      if (item.match(/[a-z]/i)) {
        newSlug += `${item}`
      }

      if (item.match(/[0-9]/i)) {
        newSlug += `${item}`
      }

      if (item === '-') {
        newSlug += `-`
      }
    })

    return newSlug;
  }


  adjustStockAfterSale(products: Product[], order: Order) {
    if (!products || !order) {
      return;
    }
    const productsToUpdate: Product[] = [];
    order.Orderproducts.forEach(item => {
      if (item && item.ProductId) {
        const product = products.find(x => x.ProductId === item.ProductId);
        if (product && product.IsJustInTime === PRODUCT_TYPE_JIT) {
          product.TotalStock = Number(product.TotalStock) - Number(item.Quantity);
          productsToUpdate.push(product);
        }
      }
    });
    if (!productsToUpdate.length) {
      return;
    }
    this.updateRange(productsToUpdate).subscribe(data => {
      console.log(data);
      if (data && data.length) {
        this.updateProductListState(data);

      }

    })
  }


}
