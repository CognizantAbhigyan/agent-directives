import { Page, Locator } from '@playwright/test';
import path from 'path';
export class BasePage {
  constructor(protected page: Page) {
  }
  private async resolve(fullPath: string): Promise<Locator> {

    const parts = fullPath.split('/');

    const elementName = parts.pop()!;

    const folderPath = parts.join('/');

    const modulePath = path.resolve(`${folderPath}/pom`);

    const module = await import(modulePath);

    const PomClass = module.POM;

    const pomInstance = new PomClass(this.page);

    const locator = pomInstance[elementName];

    if (!locator) {

      throw new Error(`Element "${elementName}" not found`);

    }

    return locator;
  }

  async getLocator(fullPath: string): Promise<Locator> {
    try {
      return await this.resolve(fullPath);
    }
    catch (error) {
      console.error(`Error resolving locator for "${fullPath}":`, error);
      throw error;
    }
  }

  //--------------------------------------------------------------------------------
  //Window Management Methods
  //--------------------------------------------------------------------------------
  async openBrowser(url: string): Promise<void> {
    await this.page.goto(url);
  }
  async closeContext(): Promise<void> {
    await this.page.context()?.close();

  }
  async closeBrowser(): Promise<void> {
    await this.page.context().browser()?.close();
  }
  async maximizeWindow(): Promise<void> {
    const viewport = this.page.viewportSize();
    if (viewport) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
    }
  }
  async setViewPortSize(width: number, height: number): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }
  async openNewWindow(url: string): Promise<void> {
    const newPage = await this.page.context().newPage();
    await newPage.goto(url);
    this.page = newPage;
  }


  //-------------------------------------------------------------------------------
  //Browser and Navigation Methods
  //-------------------------------------------------------------------------------



  async closeWindow(): Promise<void> {
    await this.page.close();
  }
  async forward(): Promise<void> {
    await this.page.goForward();
  }
  async back(): Promise<void> {
    await this.page.goBack();
  }
  async refresh(): Promise<void> {
    await this.page.reload();
  }
  async getTitle(): Promise<string> {
    return await this.page.title();
  }
  async navigateToUrl(url: string): Promise<void> {
    await this.page.goto(url);
  }

  //--------------------------------------------------------------------------------
  //Element Interaction Methods
  //--------------------------------------------------------------------------------


  async hover(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.hover();
  }
  async click(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.click();
  }
  async doubleClick(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.dblclick();
  }
  async rightClick(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.click({ button: 'right' });
  }
  async setText(fullPath: string, value: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.fill(value);
  }
  async clearText(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.fill('');
  }
  async selectOptionByLabel(fullPath: string, label: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.selectOption({ label });
  }
  async selectOptionByValue(fullPath: string, value: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.selectOption({ value });
  }
  async check(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.check();
  }
  async uncheck(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.uncheck();
  }
  async moveOver(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.hover();
  }
  async dragAndDrop(sourceFullPath: string, targetFullPath: string): Promise<void> {
    const sourceLocator = await this.getLocator(sourceFullPath);
    const targetLocator = await this.getLocator(targetFullPath);
    await sourceLocator.dragTo(targetLocator);
  }
  async uploadFile(fullPath: string, filePath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.setInputFiles(filePath);
  }
  async downloadFile(fullPath: string, savePath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      locator.click()
    ]);
    await download.saveAs(savePath);
  }
  async scrollToElement(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.scrollIntoViewIfNeeded();
  }
  async scrollBy(x: number, y: number): Promise<void> {
    await this.page.evaluate(([scrollX, scrollY]) => {
      window.scrollBy(scrollX, scrollY);
    }, [x, y]);
  }

  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0);
    });
  }
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }
  async dragAndDropByOffset(sourceFullPath: string, offsetX: number, offsetY: number): Promise<void> {
    const sourceLocator = await this.getLocator(sourceFullPath);
    const box = await sourceLocator.boundingBox();
    if (box) {
      await sourceLocator.dragTo(null, { sourcePosition: { x: box.width / 2, y: box.height / 2 }, targetPosition: { x: box.width / 2 + offsetX, y: box.height / 2 + offsetY } });
    } else {
      throw new Error(`Could not get bounding box for element "${sourceFullPath}"`);
    }
  }
  //--------------------------------------------------------------------------------
  //Checks
  //--------------------------------------------------------------------------------

  async isVisible(fullPath: string): Promise<boolean> {
    const locator = await this.getLocator(fullPath);
    return await locator.isVisible();
  }
  async isEnabled(fullPath: string): Promise<boolean> {
    const locator = await this.getLocator(fullPath);
    return await locator.isEnabled();
  }


  //--------------------------------------------------------------------------------
  //Reads
  //--------------------------------------------------------------------------------



  async getText(fullPath: string): Promise<string> {
    const locator = await this.getLocator(fullPath);
    return await locator.textContent() || '';
  }
  async getAttribute(fullPath: string, attributeName: string): Promise<string | null> {
    const locator = await this.getLocator(fullPath);
    return await locator.getAttribute(attributeName);
  }
  async getCSSValue(fullPath: string, propertyName: string): Promise<string> {
    const locator = await this.getLocator(fullPath);
    return await locator.evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, propertyName);
  }
  async getElementHeight(fullPath: string): Promise<number> {
    const locator = await this.getLocator(fullPath);
    const box = await locator.boundingBox();
    return box ? box.height : 0;
  }
  async getElementWidth(fullPath: string): Promise<number> {
    const locator = await this.getLocator(fullPath);
    const box = await locator.boundingBox();
    return box ? box.width : 0;
  }
  async getElementPosition(fullPath: string): Promise<{ x: number, y: number }> {
    const locator = await this.getLocator(fullPath);
    const box = await locator.boundingBox();
    return box ? { x: box.x, y: box.y } : { x: 0, y: 0 };
  }
  async getElementCount(fullPath: string): Promise<number> {
    const locator = await this.getLocator(fullPath);
    return await locator.count();
  }
  async getElementLeftPosition(fullPath: string): Promise<number> {
    const locator = await this.getLocator(fullPath);
    const box = await locator.boundingBox();
    return box ? box.x : 0;
  }
  async getElementTopPosition(fullPath: string): Promise<number> {
    const locator = await this.getLocator(fullPath);
    const box = await locator.boundingBox();
    return box ? box.y : 0;
  }

  //--------------------------------------------------------------------------------
  //Waits
  //--------------------------------------------------------------------------------
  
  
  async delay(milliseconds: number): Promise<void> {
    return this.page.waitForTimeout(milliseconds);
  }
  async waitForElementVisible(fullPath: string, timeout: number = 5000): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.waitFor({ state: 'visible', timeout });
  }
  async waitForElementHidden(fullPath: string, timeout: number = 5000): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.waitFor({ state: 'hidden', timeout });
  }
  async waitForElementPresent(fullPath: string, timeout: number = 5000): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.waitFor({ state: 'attached', timeout });
  }
  async waitForElementClickable(fullPath: string, timeout: number = 5000): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.waitFor({ state: 'visible', timeout });
  }
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    await this.page.waitForLoadState('load', { timeout });
  }


  //--------------------------------------------------------------------------------
  //Verifications 
  //--------------------------------------------------------------------------------


  async verifyElementPresent(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return await locator.isVisible();
    } catch (error) {
      console.error(`Error verifying element presence for "${fullPath}":`, error);
      return false;
    }
  }

  async verifyElementVisible(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return await locator.isVisible();
    } catch (error) {
      console.error(`Error verifying element visibility for "${fullPath}":`, error);
      return false;
    }
  }

  async verifyElementEnabled(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return await locator.isEnabled();
    } catch (error) {
      console.error(`Error verifying element enabled state for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyElementNotVisible(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return !(await locator.isVisible());
    } catch (error) {
      console.error(`Error verifying element not visible for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyMatches(fullPath: string, expectedValue: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualValue = await locator.textContent() || '';
      return actualValue.trim() === expectedValue.trim();
    } catch (error) {
      console.error(`Error verifying matches for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyEquals(fullPath: string, expectedValue: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualValue = await locator.textContent() || '';
      return actualValue.trim() === expectedValue.trim();
    } catch (error) {
      console.error(`Error verifying equals for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyGreaterThan(fullPath: string, expectedValue: number): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualValue = await locator.textContent() || '';
      return parseFloat(actualValue) > expectedValue;
    } catch (error) {
      console.error(`Error verifying greater than for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyLessThan(fullPath: string, expectedValue: number): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualValue = await locator.textContent() || '';
      return parseFloat(actualValue) < expectedValue;
    } catch (error) {
      console.error(`Error verifying less than for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyOptionSelectedByLabel(fullPath: string, label: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const selectedOptions = await locator.evaluate((el) => {
        const select = el as HTMLSelectElement;
        return Array.from(select.selectedOptions).map(option => option.label);
      });
      return selectedOptions.includes(label);
    } catch (error) {
      console.error(`Error verifying option selected by label for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyOptionSelectedByValue(fullPath: string, value: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const selectedOptions = await locator.evaluate((el) => {
        const select = el as HTMLSelectElement;
        return Array.from(select.selectedOptions).map(option => option.value);
      });
      return selectedOptions.includes(value);
    } catch (error) {
      console.error(`Error verifying option selected by value for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyElementAttributeValue(fullPath: string, attributeName: string, expectedValue: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualValue = await locator.getAttribute(attributeName);
      return actualValue === expectedValue;
    } catch (error) {
      console.error(`Error verifying element attribute value for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyElementText(fullPath: string, expectedText: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualText = await locator.textContent() || '';
      return actualText.trim() === expectedText.trim();
    } catch (error) {
      console.error(`Error verifying element text for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyTextNotPresent(fullPath: string, text: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualText = await locator.textContent() || '';
      return !actualText.includes(text);
    } catch (error) {
      console.error(`Error verifying text not present for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyTextPresent(fullPath: string, text: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      const actualText = await locator.textContent() || '';
      return actualText.includes(text);
    } catch (error) {
      console.error(`Error verifying text present for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyElementNotChecked(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return !(await locator.isChecked());
    } catch (error) {
      console.error(`Error verifying element not checked for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyElementChecked(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return await locator.isChecked();
    } catch (error) {
      console.error(`Error verifying element checked for "${fullPath}":`, error);
      return false;
    }
  }
  async verifyElementClickable(fullPath: string): Promise<boolean> {
    try {
      const locator = await this.getLocator(fullPath);
      return await locator.isVisible() && await locator.isEnabled();
    } catch (error) {
      console.error(`Error verifying element clickable for "${fullPath}":`, error);
      return false;
    }
  }


  //--------------------------------------------------------------------------------
  //Windows/Frames/Alerts
  //--------------------------------------------------------------------------------


  async switchToDefaultContent(): Promise<void> {
    this.page = this.page.mainFrame().page();
  }
  async switchToWindowIndex(index: number): Promise<void> {
    const pages = this.page.context().pages();
    if (index < pages.length) {
      this.page = pages[index];
    } else {
      throw new Error(`No window found at index ${index}`);
    }
  }
  async acceptAlert(): Promise<void> {
    this.page.on('dialog', async dialog => {
      await dialog.accept();
    });
  }
  async dismissAlert(): Promise<void> {
    this.page.on('dialog', async dialog => {
      await dialog.dismiss();
    });
  }
  async getAlertText(): Promise<string> {
    return new Promise((resolve) => {
      this.page.on('dialog', async dialog => {
        resolve(dialog.message());
      });
    });
  }
  async switchToWindowTitle(title: string): Promise<void> {
    const pages = this.page.context().pages();
    for (const p of pages) {
      if (await p.title() === title) {
        this.page = p;
        return;
      }
    }
    throw new Error(`No window found with title "${title}"`);
  }
  async setAlertText(text: string): Promise<void> {
    this.page.on('dialog', async dialog => {
      await dialog.accept(text);
    });
  }

  //--------------------------------------------------------------------------------
  //cookies and Local Storage
  //--------------------------------------------------------------------------------

  async getCookies(): Promise<any[]> {
    return await this.page.context().cookies();
  }
  async getAllCookies(): Promise<any[]> {
    return await this.page.context().cookies();
  }
  async deleteCookie(name: string): Promise<void> {
    await this.page.context().clearCookies();
  }
  async addCookie(name: string, value: string, options?: any): Promise<void> {
    await this.page.context().addCookies([{ name, value, ...options }]);
  }
  async deleteAllCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }


  //--------------------------------------------------------------------------------
  //Miscellaneous
  //--------------------------------------------------------------------------------


  async takeScreenshot(fullPath: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.screenshot({ path: `screenshots/${fullPath.replace(/\//g, '_')}.png` });
  }
  async executeJavaScript(script: string, ...args: any[]): Promise<any> {
    return await this.page.evaluate(script, ...args);
  }
  async takeFullPageScreenshot(fileName: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${fileName}.png`, fullPage: true });
  }
  async comment(message: string): Promise<void> {
    console.log(`COMMENT: ${message}`);
  }
  async modifyObjectProperty(fullPath: string, propertyName: string, newValue: any): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.evaluate((el, [prop, value]) => {
      (el as any)[prop] = value;
    }, [propertyName, newValue]);
  }
  async modifyObjectAttribute(fullPath: string, attributeName: string, newValue: string): Promise<void> {
    const locator = await this.getLocator(fullPath);
    await locator.evaluate((el, [attr, value]) => {
      el.setAttribute(attr, value);
    }, [attributeName, newValue]);
  }
  async modifyObjectXpath(fullPath: string, newXpath: string): Promise<void> {
    const parts = fullPath.split('/');
    const elementName = parts.pop()!;
    const folderPath = parts.join('/');
    const modulePath = path.resolve(`${folderPath}/pom`);
    const module = await import(modulePath);
    const PomClass = module.POM;
    const pomInstance = new PomClass(this.page);
    pomInstance[elementName] = this.page.locator(newXpath);
  }


}